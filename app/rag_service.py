import re
from typing import List, Dict

KNOWLEDGE_BASE: List[Dict[str, str]] = [
    {
        "category": "navigation",
        "text": "Gate A is located on the North side. Gate B is on the East side. To access the VIP lounge, use the escalators near Section 104."
    },
    {
        "category": "ticketing",
        "text": "Digital tickets must be scanned at the turnstiles. In case of scanner failure, visit the Resolution Booth next to Gate A or Section 112."
    },
    {
        "category": "food",
        "text": "Vegetarian and Halal food stalls are located in Section 108 and Section 220. The closest craft beer stand to Section 104 is 'Pitchside Brews'."
    },
    {
        "category": "emergency",
        "text": "In case of fire or evacuation, follow stadium staff instructions and head to the nearest exit (clearly marked with green signs). Medical aid stations are at Section 110 and Section 215."
    }
]

class RAGService:
    @staticmethod
    def retrieve_context(query: str) -> str:
        words = set(re.findall(r'\w+', query.lower()))
        best_matches = []
        
        for doc in KNOWLEDGE_BASE:
            doc_words = set(re.findall(r'\w+', doc["text"].lower()))
            overlap = len(words.intersection(doc_words))
            if overlap > 0:
                best_matches.append((overlap, doc["text"]))
                
        best_matches.sort(key=lambda x: x[0], reverse=True)
        retrieved_texts = [match[1] for match in best_matches[:2]]
        
        return "\n".join(retrieved_texts) if retrieved_texts else "No specific context found."
