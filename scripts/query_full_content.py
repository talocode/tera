import sqlite3, json, os, sys
from datetime import datetime

db_path = os.path.join(os.path.expanduser("~"), ".local", "share", "mimocode", "mimocode.db")
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# Get ALL sessions with their full data
print("=== ALL SESSIONS (full details) ===")
cursor.execute("""
    SELECT s.id, s.title, s.directory, s.time_created, s.time_updated, s.version
    FROM session s
    ORDER BY s.time_created DESC
""")
sessions = cursor.fetchall()
for s in sessions:
    tc = datetime.fromtimestamp(s['time_created']/1000) if s['time_created'] else 'N/A'
    tu = datetime.fromtimestamp(s['time_updated']/1000) if s['time_updated'] else 'N/A'
    print(f"\n{'='*60}")
    print(f"  Session: {s['id']}")
    print(f"  Title: {s['title']}")
    print(f"  Directory: {s['directory']}")
    print(f"  Created: {tc}")
    print(f"  Updated: {tu}")
    print(f"  Version: {s['version']}")

    # Get messages for this session
    cursor2 = conn.cursor()
    cursor2.execute("""
        SELECT m.id, m.time_created, json_extract(m.data, '$.role') as role,
               json_extract(m.data, '$.mode') as mode,
               json_extract(m.data, '$.content') as content
        FROM message m
        WHERE m.session_id = ?
        ORDER BY m.time_created
    """, (s['id'],))
    messages = cursor2.fetchall()
    print(f"  Messages: {len(messages)}")

    for msg in messages:
        mtc = datetime.fromtimestamp(msg['time_created']/1000) if msg['time_created'] else 'N/A'
        role = msg['role']
        mode = msg['mode']
        content = msg['content']

        if role == 'user':
            # Try to get full content from the data JSON
            cursor3 = conn.cursor()
            cursor3.execute("SELECT data FROM message WHERE id = ?", (msg['id'],))
            data_row = cursor3.fetchone()
            if data_row:
                data = json.loads(data_row[0])
                content_str = json.dumps(data, indent=2)[:500]
            else:
                content_str = str(content)[:500] if content else 'N/A'
            print(f"\n    [{mtc}] USER (mode={mode}):")
            print(f"      {content_str[:400]}")
        elif role == 'assistant':
            # Get tool calls for this message
            cursor3 = conn.cursor()
            cursor3.execute("""
                SELECT json_extract(p.data, '$.tool') as tool,
                       json_extract(p.data, '$.state.input') as input_data,
                       json_extract(p.data, '$.state.output') as output_data
                FROM part p
                WHERE p.message_id = ?
                  AND json_extract(p.data, '$.type') = 'tool'
            """, (msg['id'],))
            tools = cursor3.fetchall()
            if tools:
                print(f"\n    [{mtc}] ASSISTANT (mode={mode}):")
                for t in tools:
                    tool_name = t['tool']
                    input_data = t['input_data']
                    output_data = t['output_data']
                    if input_data:
                        try:
                            input_dict = json.loads(input_data)
                            input_preview = json.dumps(input_dict, indent=2)[:200]
                        except:
                            input_preview = str(input_data)[:200]
                    else:
                        input_preview = 'N/A'
                    print(f"      Tool: {tool_name}")
                    print(f"      Input: {input_preview[:150]}")

conn.close()
