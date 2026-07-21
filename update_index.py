import json
import codecs

with codecs.open('parsed_menu.json', 'r', 'utf-8-sig') as f:
    menu_data = json.load(f)

# Format as python dict string
menu_data_str = "menu_data = " + json.dumps(menu_data, indent=2) + "\n"

with open("api/index.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

out_lines = []
in_menu = False
for line in lines:
    if line.startswith("menu_data = ["):
        in_menu = True
        out_lines.append(menu_data_str)
    elif in_menu:
        if line.strip() == "]":
            in_menu = False
    else:
        out_lines.append(line)

# Update get_menu to overwrite if dummy
new_get_menu = """@app.get("/api/menu")
def get_menu():
    items = list(menu_collection.find({}, {"_id": 0}))
    # If the dummy data is detected (8 items with Cappuccino), overwrite
    if len(items) == 8 and any(i.get("name") == "Cappuccino" and i.get("desc", "").startswith("A classic") for i in items):
        menu_collection.delete_many({})
        items = []
        
    if not items:
        menu_collection.insert_many(menu_data)
        items = list(menu_collection.find({}, {"_id": 0}))
    return items
"""

final_lines = []
in_get_menu = False
for line in out_lines:
    if line.startswith("@app.get(\"/api/menu\")"):
        in_get_menu = True
        final_lines.append(new_get_menu)
    elif in_get_menu:
        if line.strip() == "return items":
            in_get_menu = False
    else:
        final_lines.append(line)

with open("api/index.py", "w", encoding="utf-8") as f:
    f.writelines(final_lines)

print("Updated api/index.py successfully!")
