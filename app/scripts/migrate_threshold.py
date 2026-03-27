from sqlalchemy import text

from app.core.database import engine


def run() -> None:
    statements = [
        "ALTER TABLE documents ADD COLUMN IF NOT EXISTS total_collaborators INTEGER NOT NULL DEFAULT 2",
        "ALTER TABLE documents ADD COLUMN IF NOT EXISTS threshold_required INTEGER NOT NULL DEFAULT 2",
    ]
    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))
    print("Migration complete: total_collaborators, threshold_required")


if __name__ == "__main__":
    run()
