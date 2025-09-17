import subprocess
import os

# Ensure we're in the backend directory
os.chdir('D:/Judicature-2/backend')

subprocess.run(["chroma", "run", "--path", "./chroma"])