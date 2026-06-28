import sqlite3, json, os, sys
from datetime import datetime

db_path = os.path.join(os.path.expanduser("~"), ".local", "share", "mimocode", "mimocode.db")
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# Get all messages with their data structure
print("=== MESSAGE DATA STRUCTURES ===")
cursor.execute("""
    SELECT m.id, m.session_id, m.time_created, json_extract(m.data, '$.role') as role,
           json_extract(m.data, '$.content') as content
    FROM message m
    WHERE m.session_id IN (
        SELECT id FROM session WHERE directory LIKE '%Tera%'
    )
    ORDER BY m.time_created DESC
    LIMIT 30
""")
for row in cursor.fetchall():
    tc = datetime.fromtimestamp(row['time_created']/1000) if row['time_created'] else 'N/A'
    role = row['role']
    content = row['content']
    if content and len(str(content)) > 0:
        content_str = str(content)[:300]
    else:
        # Try to get content from data JSON
        cursor2 = conn.cursor()
        cursor2.execute("SELECT data FROM message WHERE id = ?", (row['id'],))
        data_row = cursor2.fetchone()
        if data_row:
            data = json.loads(data_row[0])
            content_str = json.dumps(data, indent=2)[:300]
        else:
            content_str = 'N/A'
    sid = row['session_id'][:16] if row['session_id'] else 'N/A'
    print(f"\n  [{tc}] session={sid} role={role}")
    print(f"    {content_str}")

# Get assistant messages with tool calls
print("\n\n=== ASSISTANT TOOL CALLS ===")
cursor.execute("""
    SELECT m.id, m.session_id, m.time_created,
           json_extract(p.data, '$.tool') as tool,
           json_extract(p.data, '$.state.input') as input_data
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'tool'
    ORDER BY m.time_created DESC
    LIMIT 40
""")
for row in cursor.fetchall():
    tc = datetime.fromtimestamp(row['time_created']/1000) if row['time_created'] else 'N/A'
    tool = row['tool']
    input_data = row['input_data']
    if input_data:
        try:
            input_dict = json.loads(input_data)
            input_preview = json.dumps(input_dict, indent=2)[:200]
        except:
            input_preview = str(input_data)[:200]
    else:
        input_preview = 'N/A'
    sid = row['session_id'][:16] if row['session_id'] else 'N/A'
    print(f"\n  [{tc}] session={sid} tool={tool}")
    print(f"    {input_preview}")

conn.close()
