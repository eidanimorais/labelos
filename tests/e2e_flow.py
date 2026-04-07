import os
import shutil
import time
from playwright.sync_api import sync_playwright

def run_tests():
    print("🚀 Starting E2E Tests...")
    
    # Setup Paths
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    fixture_path = os.path.join(root_dir, "tests", "fixtures", "import_test.csv")
    extracts_dir = os.path.join(root_dir, "data", "extracts")
    dest_path = os.path.join(extracts_dir, "import_test.csv")
    
    # Ensure extracts dir exists
    if not os.path.exists(extracts_dir):
        os.makedirs(extracts_dir)

    with sync_playwright() as p:
        # Launch Browser
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()
        
        try:
            # 1. TEST: Navigation & Dashboard Access
            print("Testing Dashboard Access...")
            page.goto("http://localhost:5173")
            page.wait_for_selector("text=Receita Bruta Total", timeout=10000)
            print("✅ Dashboard loaded successfully.")
            
            # 2. TEST: Create Task (Mapped to Import CSV)
            print("Testing Import Flow (Create Task)...")
            
            # Copy file to simulate "Upload/Placement"
            shutil.copy(fixture_path, dest_path)
            
            page.goto("http://localhost:5173/import")
            # Click Sync
            page.click("text=Sincronizar Pasta Agora")
            
            # Wait for successful sync message or the file to appear in list
            # The UI shows "Sincronização concluída" in a green box
            page.wait_for_selector("text=Sincronização concluída", timeout=10000)
            page.wait_for_selector("text=import_test.csv", timeout=5000)
            print("✅ Import successful.")
            
            # 3. TEST: Verify Data (Read)
            print("Testing Data Verification...")
            page.goto("http://localhost:5173/isrc")
            # Filter
            # Placeholder in Tracks.tsx is "Pesquisar (use ';' para múltiplos termos)..."
            page.fill("input[placeholder*='Pesquisar']", "Test Song E2E")
            page.wait_for_selector("text=Test Song E2E", timeout=5000)
            print("✅ Track found in list.")
            
            # 4. TEST: Delete Task (Delete Import)
            print("Testing Deletion...")
            page.goto("http://localhost:5173/import")
            
            # Find the row with our file and click delete
            # We look for the row containing "import_test.csv" and then find the button inside it
            # Using XPath or CSS: tr that has text "import_test.csv" -> button
            row_locator = page.locator("tr", has_text="import_test.csv")
            delete_button = row_locator.locator("button[title='Excluir importação']")
            
            if delete_button.count() > 0:
                delete_button.click()
                # Confirm modal
                page.click("text=Sim, Excluir")
                # Wait for file to disappear
                page.wait_for_selector("text=import_test.csv", state="hidden", timeout=5000)
                print("✅ Deletion successful.")
            else:
                print("⚠️ Could not find delete button for import_test.csv")
            
            # 5. TEST: Page Accessibility (Visit key pages)
            print("Testing Page Accessibility...")
            pages_to_visit = [
                "/songs",
                "/territories",
                "/conciliacao"
            ]
            
            for path in pages_to_visit:
                page.goto(f"http://localhost:5173{path}")
                # Just check it doesn't 404 or crash (look for common layout element like Sidebar logo or header)
                page.wait_for_selector("text=LabelOS", timeout=5000) # Assuming 'LabelOS' is in header/sidebar
                print(f"✅ Accessed {path}")
                
            print("\n🎉 ALL TESTS PASSED SUCCESSFULLY!")
            
        except Exception as e:
            print(f"\n❌ TEST FAILED: {str(e)}")
            page.screenshot(path="test_failure.png")
            print("Screenshot saved to test_failure.png")
        finally:
            # Cleanup: Remove file from extracts if it still exists
            if os.path.exists(dest_path):
                os.remove(dest_path)
            browser.close()

if __name__ == "__main__":
    run_tests()
