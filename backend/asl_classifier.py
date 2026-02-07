"""
ASL Letter Classifier - Rule-Based System
Classifies hand landmarks into ASL letters using generalized rule evaluation
"""

import math
from typing import Dict, Optional, Tuple, List, Any


class ASLClassifier:
    """Classifies hand landmarks into ASL letters using a rule-based system"""
    
    def __init__(self):
        """Initialize the ASL classifier"""
        self.min_confidence = 0.3  # Minimum confidence to return a result
        self.letter_rules = self._define_letter_rules()
    
    def _define_letter_rules(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Define rules for each ASL letter
        
        Each rule is a dictionary with:
        - type: The type of check to perform
        - params: Parameters for that check
        - weight: How much this rule contributes to confidence (0.0-1.0)
        """
        return {
            'A': [
                {'type': 'fingers_curled', 'params': {'fingers': ['INDEX', 'MIDDLE', 'RING', 'PINKY']}, 'weight': 0.5},
                {'type': 'thumb_at_finger_level', 'params': {}, 'weight': 0.3},
                {'type': 'thumb_extended_sideways', 'params': {}, 'weight': 0.2},
            ],
            
            'B': [
                {'type': 'fingers_extended', 'params': {'fingers': ['INDEX', 'MIDDLE', 'RING', 'PINKY']}, 'weight': 0.4},
                {'type': 'fingers_together', 'params': {'fingers': ['INDEX', 'MIDDLE', 'RING', 'PINKY']}, 'weight': 0.2},
                {'type': 'thumb_across_palm', 'params': {}, 'weight': 0.4},
            ],
            
            'C': [
                {'type': 'hand_curved', 'params': {}, 'weight': 0.5},
                {'type': 'thumb_to_fingers_distance', 'params': {'min_dist': 0.15, 'max_dist': 0.35}, 'weight': 0.3},
                {'type': 'fingers_partially_curled', 'params': {}, 'weight': 0.2},
            ],
            
            'D': [
                {'type': 'fingers_extended', 'params': {'fingers': ['INDEX']}, 'weight': 0.4},
                {'type': 'fingers_curled', 'params': {'fingers': ['MIDDLE', 'RING', 'PINKY']}, 'weight': 0.3},
                {'type': 'fingertips_touching', 'params': {'finger1': 'THUMB', 'finger2': 'MIDDLE', 'threshold': 0.08}, 'weight': 0.3},
            ],
            
            'E': [
                {'type': 'fingers_curled', 'params': {'fingers': ['INDEX', 'MIDDLE', 'RING', 'PINKY']}, 'weight': 0.5},
                {'type': 'thumb_close_to_hand', 'params': {}, 'weight': 0.3},
                {'type': 'tight_fist', 'params': {}, 'weight': 0.2},
            ],
            
            'F': [
                {'type': 'fingertips_touching', 'params': {'finger1': 'THUMB', 'finger2': 'INDEX', 'threshold': 0.06}, 'weight': 0.5},
                {'type': 'fingers_extended', 'params': {'fingers': ['MIDDLE', 'RING', 'PINKY']}, 'weight': 0.5},
            ],
            
            'I': [
                {'type': 'fingers_extended', 'params': {'fingers': ['PINKY']}, 'weight': 0.5},
                {'type': 'fingers_curled', 'params': {'fingers': ['INDEX', 'MIDDLE', 'RING', 'THUMB']}, 'weight': 0.5},
            ],
            
            'L': [
                {'type': 'fingers_extended', 'params': {'fingers': ['INDEX', 'THUMB']}, 'weight': 0.8},
                {'type': 'fingers_curled', 'params': {'fingers': ['MIDDLE', 'RING', 'PINKY']}, 'weight': 0.2},
            ],
            
            'O': [
                {'type': 'all_fingertips_together', 'params': {'max_distance': 0.08}, 'weight': 0.7},
                {'type': 'fingers_partially_curled', 'params': {}, 'weight': 0.3},
            ],
            
            'V': [
                {'type': 'fingers_extended', 'params': {'fingers': ['INDEX', 'MIDDLE']}, 'weight': 0.6},
                {'type': 'fingers_curled', 'params': {'fingers': ['RING', 'PINKY']}, 'weight': 0.3},
                {'type': 'fingers_separated', 'params': {'finger1': 'INDEX', 'finger2': 'MIDDLE', 'min_dist': 0.05}, 'weight': 0.1},
            ],
            
            'W': [
                {'type': 'fingers_extended', 'params': {'fingers': ['INDEX', 'MIDDLE', 'RING']}, 'weight': 0.7},
                {'type': 'fingers_curled', 'params': {'fingers': ['PINKY', 'THUMB']}, 'weight': 0.3},
            ],
            
            'Y': [
                {'type': 'fingers_extended', 'params': {'fingers': ['THUMB', 'PINKY']}, 'weight': 0.7},
                {'type': 'fingers_curled', 'params': {'fingers': ['INDEX', 'MIDDLE', 'RING']}, 'weight': 0.3},
            ],
        }
    
    def classify(self, hand_data) -> Tuple[Optional[str], float]:
        """
        Classify hand landmarks into an ASL letter
        
        Args:
            hand_data: HandData object with landmarks
            
        Returns:
            Tuple of (letter, confidence) where letter is None if confidence too low
        """
        if hand_data is None:
            return None, 0.0
        
        landmarks = hand_data.get_all_landmarks()
        if not landmarks or len(landmarks) != 21:
            return None, 0.0
        
        # Evaluate each letter's rules
        best_letter = None
        best_confidence = 0.0
        
        for letter, rules in self.letter_rules.items():
            confidence = self._evaluate_rules(landmarks, rules)
            
            if confidence > best_confidence:
                best_letter = letter
                best_confidence = confidence
        
        # Return None if confidence is too low
        if best_confidence < self.min_confidence:
            return None, best_confidence
        
        return best_letter, best_confidence
    
    def _evaluate_rules(self, landmarks: List, rules: List[Dict]) -> float:
        """
        Evaluate all rules for a letter and calculate total confidence
        
        Args:
            landmarks: List of hand landmarks
            rules: List of rule dictionaries
            
        Returns:
            Total confidence score (0.0-1.0)
        """
        total_confidence = 0.0
        
        for rule in rules:
            rule_type = rule['type']
            params = rule.get('params', {})
            weight = rule.get('weight', 0.0)
            
            # Check if rule passes
            if self._check_rule(landmarks, rule_type, params):
                total_confidence += weight
        
        return min(total_confidence, 1.0)  # Cap at 1.0
    
    def _check_rule(self, landmarks: List, rule_type: str, params: Dict) -> bool:
        """
        Check if a specific rule passes
        
        Args:
            landmarks: List of hand landmarks
            rule_type: Type of rule to check
            params: Parameters for the rule
            
        Returns:
            True if rule passes, False otherwise
        """
        # Map rule types to checking functions
        rule_checkers = {
            'fingers_extended': self._check_fingers_extended,
            'fingers_curled': self._check_fingers_curled,
            'fingertips_touching': self._check_fingertips_touching,
            'fingers_together': self._check_fingers_together,
            'fingers_separated': self._check_fingers_separated,
            'thumb_across_palm': self._check_thumb_across_palm,
            'thumb_at_finger_level': self._check_thumb_at_finger_level,
            'thumb_extended_sideways': self._check_thumb_extended_sideways,
            'thumb_close_to_hand': self._check_thumb_close_to_hand,
            'hand_curved': self._check_hand_curved,
            'thumb_to_fingers_distance': self._check_thumb_to_fingers_distance,
            'fingers_partially_curled': self._check_fingers_partially_curled,
            'tight_fist': self._check_tight_fist,
            'all_fingertips_together': self._check_all_fingertips_together,
        }
        
        checker = rule_checkers.get(rule_type)
        if checker:
            return checker(landmarks, params)
        
        return False
    
    # ========== Helper Methods ==========
    
    def _distance(self, p1: Dict, p2: Dict) -> float:
        """Calculate Euclidean distance between two points"""
        return math.sqrt((p1['x'] - p2['x'])**2 + 
                        (p1['y'] - p2['y'])**2 + 
                        (p1['z'] - p2['z'])**2)
    
    def _get_finger_tip_index(self, finger: str) -> int:
        """Get the landmark index for a finger tip"""
        tips = {
            'THUMB': 4, 'INDEX': 8, 'MIDDLE': 12, 'RING': 16, 'PINKY': 20
        }
        return tips.get(finger, -1)
    
    def _is_finger_extended(self, landmarks: List, finger: str) -> bool:
        """Check if a finger is extended (straightened)"""
        finger_indices = {
            'INDEX': [5, 6, 7, 8],
            'MIDDLE': [9, 10, 11, 12],
            'RING': [13, 14, 15, 16],
            'PINKY': [17, 18, 19, 20],
            'THUMB': [1, 2, 3, 4]
        }
        
        if finger not in finger_indices:
            return False
        
        indices = finger_indices[finger]
        wrist = landmarks[0]
        
        # For thumb, use different logic
        if finger == 'THUMB':
            tip = landmarks[4]
            mcp = landmarks[2]
            dist_tip = self._distance(wrist, tip)
            dist_mcp = self._distance(wrist, mcp)
            return dist_tip > dist_mcp * 1.2
        
        # For other fingers
        tip = landmarks[indices[3]]
        base = landmarks[indices[0]]
        
        dist_tip = self._distance(wrist, tip)
        dist_base = self._distance(wrist, base)
        
        return dist_tip > dist_base * 0.9
    
    # ========== Rule Checking Functions ==========
    
    def _check_fingers_extended(self, landmarks: List, params: Dict) -> bool:
        """Check if specified fingers are extended"""
        fingers = params.get('fingers', [])
        return all(self._is_finger_extended(landmarks, f) for f in fingers)
    
    def _check_fingers_curled(self, landmarks: List, params: Dict) -> bool:
        """Check if specified fingers are curled"""
        fingers = params.get('fingers', [])
        return all(not self._is_finger_extended(landmarks, f) for f in fingers)
    
    def _check_fingertips_touching(self, landmarks: List, params: Dict) -> bool:
        """Check if two fingertips are touching"""
        finger1 = params.get('finger1', 'THUMB')
        finger2 = params.get('finger2', 'INDEX')
        threshold = params.get('threshold', 0.06)
        
        tip1_idx = self._get_finger_tip_index(finger1)
        tip2_idx = self._get_finger_tip_index(finger2)
        
        if tip1_idx < 0 or tip2_idx < 0:
            return False
        
        distance = self._distance(landmarks[tip1_idx], landmarks[tip2_idx])
        return distance < threshold
    
    def _check_fingers_together(self, landmarks: List, params: Dict) -> bool:
        """Check if specified fingers are close together"""
        fingers = params.get('fingers', [])
        max_gap = params.get('max_gap', 0.08)
        
        tip_indices = [self._get_finger_tip_index(f) for f in fingers]
        tip_indices = [i for i in tip_indices if i >= 0]
        
        if len(tip_indices) < 2:
            return False
        
        # Check consecutive pairs
        for i in range(len(tip_indices) - 1):
            dist = self._distance(landmarks[tip_indices[i]], landmarks[tip_indices[i+1]])
            if dist > max_gap:
                return False
        
        return True
    
    def _check_fingers_separated(self, landmarks: List, params: Dict) -> bool:
        """Check if two fingers are separated"""
        finger1 = params.get('finger1', 'INDEX')
        finger2 = params.get('finger2', 'MIDDLE')
        min_dist = params.get('min_dist', 0.05)
        
        tip1_idx = self._get_finger_tip_index(finger1)
        tip2_idx = self._get_finger_tip_index(finger2)
        
        if tip1_idx < 0 or tip2_idx < 0:
            return False
        
        distance = self._distance(landmarks[tip1_idx], landmarks[tip2_idx])
        return distance > min_dist
    
    def _check_thumb_across_palm(self, landmarks: List, params: Dict) -> bool:
        """Check if thumb is across the palm"""
        thumb_tip = landmarks[4]
        index_mcp = landmarks[5]
        pinky_mcp = landmarks[17]
        
        # Thumb should be between index and pinky MCP joints
        return (min(index_mcp['x'], pinky_mcp['x']) < thumb_tip['x'] < 
                max(index_mcp['x'], pinky_mcp['x']))
    
    def _check_thumb_at_finger_level(self, landmarks: List, params: Dict) -> bool:
        """Check if thumb is at the same level as curled fingers"""
        thumb_tip = landmarks[4]
        index_mcp = landmarks[5]
        
        # Thumb should be roughly at same height as MCP joints
        return abs(thumb_tip['y'] - index_mcp['y']) < 0.15
    
    def _check_thumb_extended_sideways(self, landmarks: List, params: Dict) -> bool:
        """Check if thumb is extended to the side"""
        thumb_tip = landmarks[4]
        thumb_ip = landmarks[3]
        
        return self._distance(thumb_tip, thumb_ip) > 0.03
    
    def _check_thumb_close_to_hand(self, landmarks: List, params: Dict) -> bool:
        """Check if thumb is close to the hand (tucked)"""
        thumb_tip = landmarks[4]
        wrist = landmarks[0]
        
        return self._distance(thumb_tip, wrist) < 0.2
    
    def _check_hand_curved(self, landmarks: List, params: Dict) -> bool:
        """Check if hand forms a curved shape"""
        thumb_tip = landmarks[4]
        pinky_tip = landmarks[20]
        
        curve_dist = self._distance(thumb_tip, pinky_tip)
        return 0.15 < curve_dist < 0.35
    
    def _check_thumb_to_fingers_distance(self, landmarks: List, params: Dict) -> bool:
        """Check distance between thumb and fingers"""
        thumb_tip = landmarks[4]
        pinky_tip = landmarks[20]
        min_dist = params.get('min_dist', 0.0)
        max_dist = params.get('max_dist', 1.0)
        
        dist = self._distance(thumb_tip, pinky_tip)
        return min_dist < dist < max_dist
    
    def _check_fingers_partially_curled(self, landmarks: List, params: Dict) -> bool:
        """Check if fingers are partially curled (not fully extended or curled)"""
        wrist = landmarks[0]
        finger_tips = [8, 12, 16, 20]
        
        partial_count = sum(
            0.4 < self._distance(wrist, landmarks[i]) < 0.7
            for i in finger_tips
        )
        
        return partial_count >= 3
    
    def _check_tight_fist(self, landmarks: List, params: Dict) -> bool:
        """Check if fingers form a tight fist"""
        wrist = landmarks[0]
        finger_tips = [8, 12, 16, 20]
        
        total_dist = sum(self._distance(wrist, landmarks[i]) for i in finger_tips)
        return total_dist < 1.0
    
    def _check_all_fingertips_together(self, landmarks: List, params: Dict) -> bool:
        """Check if all fingertips are close together"""
        max_distance = params.get('max_distance', 0.08)
        
        tips = [landmarks[4], landmarks[8], landmarks[12], landmarks[16], landmarks[20]]
        
        # Calculate center point
        avg_x = sum(t['x'] for t in tips) / len(tips)
        avg_y = sum(t['y'] for t in tips) / len(tips)
        avg_z = sum(t['z'] for t in tips) / len(tips)
        center = {'x': avg_x, 'y': avg_y, 'z': avg_z}
        
        # All tips should be within max_distance of center
        max_dist = max(self._distance(t, center) for t in tips)
        return max_dist < max_distance
