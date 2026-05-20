import os

file_path = 'src/AdminPanel.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Replace if(true) blocks
content = content.replace("onClick={async () => {\n                                                if (true) {\n                                                  try {\n                                                    await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'rejected' });",
"onClick={async () => {\n                                                if (!window.confirm('Are you sure you want to Move to Rejected?')) return;\n                                                try {\n                                                  await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'rejected' });")

content = content.replace("onClick={async () => {\n                                                if (true) {\n                                                  try {\n                                                    await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'approved' });",
"onClick={async () => {\n                                                if (!window.confirm('Restore application to Approved?')) return;\n                                                try {\n                                                  await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'approved' });")

content = content.replace("onClick={async () => {\n                                            if (true) {\n                                              try {\n                                                await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'rejected' });",
"onClick={async () => {\n                                            if (!window.confirm('Are you sure you want to Move to Rejected?')) return;\n                                            try {\n                                              await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'rejected' });")

content = content.replace("onClick={async () => {\n                                            if (true) {\n                                              try {\n                                                await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'approved' });",
"onClick={async () => {\n                                            if (!window.confirm('Restore application to Approved?')) return;\n                                            try {\n                                              await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'approved' });")

# Replace initial approval/rejection missing confirmations
content = content.replace("onClick={async () => {\n                                                  try {\n                                                    await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'approved' });",
"onClick={async () => {\n                                                  if (!window.confirm('Are you sure you want to approve this application?')) return;\n                                                  try {\n                                                    await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'approved' });")

content = content.replace("onClick={async () => {\n                                                  try {\n                                                    await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'rejected' });",
"onClick={async () => {\n                                                  if (!window.confirm('Are you sure you want to reject this application?')) return;\n                                                  try {\n                                                    await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'rejected' });")

content = content.replace("onClick={async () => {\n                                              try {\n                                                await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'approved' });",
"onClick={async () => {\n                                              if (!window.confirm('Are you sure you want to approve this application?')) return;\n                                              try {\n                                                await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'approved' });")

content = content.replace("onClick={async () => {\n                                              try {\n                                                await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'rejected' });",
"onClick={async () => {\n                                              if (!window.confirm('Are you sure you want to reject this application?')) return;\n                                              try {\n                                                await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'rejected' });")

with open(file_path, 'w') as f:
    f.write(content)
