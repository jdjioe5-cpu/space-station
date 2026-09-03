# 🛡️ Metaverse Safety, Moderation & Privacy Specification (space-station)

Technical specification for role-based moderation matrices, sliding-window rate limiters, user-to-user blocking, and presence privacy masking in **MyZubster Space Station** (resolves Issue #37).

---

## 📌 Architecture
- **5-Tier Permission Matrix**: `ADMIN` > `ROOM_OWNER` > `MODERATOR` > `USER` > `GUEST`.
- **Privacy Shield**: Strict zero-exposure policy for physical IPs, geographic GPS coordinates, or private wallet balances in world presence packets.
- **Sliding-Window Anti-Spam**: Prevents Sybil message floods and bot manipulation in spatial chats.
- **Cryptographic Audit Log**: Every moderation action receives an auditable SHA-256 signature.
