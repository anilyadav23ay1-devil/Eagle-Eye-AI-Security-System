import time
import math
from datetime import datetime
from typing import List, Dict, Tuple, Optional
from models.schemas import (
    SecurityAlert, SecurityRule, RoomZone, Person,
    AlertType, AlertSeverity, AlertStatus
)
from services.ai_vision_engine import DetectedObject

class SecurityRulesEngine:
    def __init__(self):
        self.doorway_crossings: List[Tuple[str, float]] = []  # (track_id, timestamp)
        self.zone_entry_timestamps: Dict[str, Dict[str, float]] = {}  # {track_id: {zone_name: timestamp}}
        self.active_alert_cooldowns: Dict[str, float] = {}  # Prevent spamming duplicate alerts (30s cooldown)

    def evaluate_rules(
        self,
        camera_id: str,
        building_name: str,
        floor_name: str,
        detected_objects: List[DetectedObject],
        rooms: List[RoomZone],
        persons_db: Dict[str, Person],
        active_rules: List[SecurityRule]
    ) -> List[SecurityAlert]:
        """Evaluates live vision detections against active security rules and returns generated alerts."""
        generated_alerts: List[SecurityAlert] = []
        now = time.time()
        now_str = datetime.now().strftime("%I:%M %p")

        # Map rules by type
        rules_by_type = {r.type: r for r in active_rules if r.is_enabled}

        # 1. Evaluate Geofencing & Restricted Area Access
        if AlertType.RESTRICTED_ZONE in rules_by_type or AlertType.UNAUTHORIZED_ACCESS in rules_by_type:
            for obj in detected_objects:
                if not obj.current_zone:
                    continue

                matched_room = next((r for r in rooms if r.name == obj.current_zone), None)
                if not matched_room:
                    continue

                # If room is restricted and person is unknown or unauthorized
                if matched_room.is_restricted:
                    person = persons_db.get(obj.matched_person_id) if obj.matched_person_id else None
                    is_allowed = person and (matched_room.name in person.allowed_zones or person.role in matched_room.allowed_roles)

                    if not is_allowed:
                        cooldown_key = f"geofence-{obj.track_id}-{matched_room.name}"
                        if now - self.active_alert_cooldowns.get(cooldown_key, 0) > 30.0:
                            self.active_alert_cooldowns[cooldown_key] = now
                            alert = SecurityAlert(
                                id=f"alt-{int(now * 1000)}",
                                alert_id=f"ALT-{datetime.now().strftime('%Y%m%d')}-{len(self.active_alert_cooldowns):04d}",
                                timestamp=now_str,
                                severity=AlertSeverity.CRITICAL if matched_room.is_restricted else AlertSeverity.HIGH,
                                type=AlertType.RESTRICTED_ZONE if matched_room.is_restricted else AlertType.UNAUTHORIZED_ACCESS,
                                title=f"Restricted Zone Breach — {matched_room.name}",
                                description=f"Target {obj.matched_name or obj.track_id} detected inside {matched_room.name} without clearance.",
                                building=building_name,
                                floor=floor_name,
                                room=matched_room.name,
                                camera_id=camera_id,
                                person_id=obj.matched_person_id or "UNKNOWN",
                                track_id=obj.track_id,
                                person_name=obj.matched_name or "Unknown Target",
                                status=AlertStatus.ACTIVE,
                                guard_notes="Automated geofence intrusion trigger."
                            )
                            generated_alerts.append(alert)

        # 2. Evaluate Loitering Rule
        loitering_rule = rules_by_type.get(AlertType.LOITERING)
        if loitering_rule and loitering_rule.threshold_seconds > 0:
            threshold = loitering_rule.threshold_seconds
            for obj in detected_objects:
                if not obj.current_zone:
                    continue

                if obj.track_id not in self.zone_entry_timestamps:
                    self.zone_entry_timestamps[obj.track_id] = {}

                if obj.current_zone not in self.zone_entry_timestamps[obj.track_id]:
                    self.zone_entry_timestamps[obj.track_id][obj.current_zone] = now
                else:
                    dwell = now - self.zone_entry_timestamps[obj.track_id][obj.current_zone]
                    if dwell > threshold:
                        cooldown_key = f"loiter-{obj.track_id}-{obj.current_zone}"
                        if now - self.active_alert_cooldowns.get(cooldown_key, 0) > 45.0:
                            self.active_alert_cooldowns[cooldown_key] = now
                            alert = SecurityAlert(
                                id=f"alt-{int(now * 1000)}",
                                alert_id=f"ALT-{datetime.now().strftime('%Y%m%d')}-{len(self.active_alert_cooldowns):04d}",
                                timestamp=now_str,
                                severity=AlertSeverity.MEDIUM,
                                type=AlertType.LOITERING,
                                title=f"Loitering Threshold Exceeded — {obj.current_zone}",
                                description=f"Target {obj.matched_name or obj.track_id} has lingered for {int(dwell)}s in {obj.current_zone} (limit: {threshold}s).",
                                building=building_name,
                                floor=floor_name,
                                room=obj.current_zone,
                                camera_id=camera_id,
                                person_id=obj.matched_person_id or "UNKNOWN",
                                track_id=obj.track_id,
                                person_name=obj.matched_name or "Subject",
                                status=AlertStatus.ACTIVE,
                                guard_notes="Automated loitering sensor trigger."
                            )
                            generated_alerts.append(alert)

        # 3. Evaluate Tailgating at Access Portals
        if AlertType.TAILGATING in rules_by_type:
            if len(detected_objects) >= 2:
                cooldown_key = f"tailgate-{camera_id}"
                if now - self.active_alert_cooldowns.get(cooldown_key, 0) > 60.0:
                    obj1, obj2 = detected_objects[0], detected_objects[1]
                    dist = math.hypot(obj1.centroid[0] - obj2.centroid[0], obj1.centroid[1] - obj2.centroid[1])
                    if dist < 80:  # Physical proximity threshold at doorway
                        self.active_alert_cooldowns[cooldown_key] = now
                        alert = SecurityAlert(
                            id=f"alt-{int(now * 1000)}",
                            alert_id=f"ALT-{datetime.now().strftime('%Y%m%d')}-{len(self.active_alert_cooldowns):04d}",
                            timestamp=now_str,
                            severity=AlertSeverity.HIGH,
                            type=AlertType.TAILGATING,
                            title="Tailgating Detected at Portal",
                            description=f"Multiple targets ({obj1.track_id} and {obj2.track_id}) detected in single-person access zone.",
                            building=building_name,
                            floor=floor_name,
                            room=obj1.current_zone or "Access Portal",
                            camera_id=camera_id,
                            person_id=obj1.matched_person_id,
                            track_id=f"{obj1.track_id}+{obj2.track_id}",
                            person_name="Multiple Subjects",
                            status=AlertStatus.ACTIVE,
                            guard_notes="Automated tailgating optical tripwire."
                        )
                        generated_alerts.append(alert)

        # 4. Evaluate Room Overcrowding / Maximum Capacity
        if AlertType.OVERCROWDING in rules_by_type:
            zone_counts: Dict[str, int] = {}
            for obj in detected_objects:
                if obj.current_zone:
                    zone_counts[obj.current_zone] = zone_counts.get(obj.current_zone, 0) + 1

            for zone_name, count in zone_counts.items():
                matched_room = next((r for r in rooms if r.name == zone_name), None)
                if matched_room and matched_room.max_capacity > 0 and count > matched_room.max_capacity:
                    cooldown_key = f"capacity-{zone_name}"
                    if now - self.active_alert_cooldowns.get(cooldown_key, 0) > 60.0:
                        self.active_alert_cooldowns[cooldown_key] = now
                        alert = SecurityAlert(
                            id=f"alt-{int(now * 1000)}",
                            alert_id=f"ALT-{datetime.now().strftime('%Y%m%d')}-{len(self.active_alert_cooldowns):04d}",
                            timestamp=now_str,
                            severity=AlertSeverity.MEDIUM,
                            type=AlertType.OVERCROWDING,
                            title=f"Room Capacity Exceeded — {zone_name}",
                            description=f"Zone {zone_name} has {count} occupants (max limit: {matched_room.max_capacity}).",
                            building=building_name,
                            floor=floor_name,
                            room=zone_name,
                            camera_id=camera_id,
                            person_id="MULTIPLE",
                            track_id=f"COUNT-{count}",
                            person_name=f"{count} Occupants",
                            status=AlertStatus.ACTIVE,
                            guard_notes="Automated capacity threshold sensor."
                        )
                        generated_alerts.append(alert)

        return generated_alerts

rules_engine = SecurityRulesEngine()
