from playwright.sync_api import sync_playwright
import os

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    
    page.goto('http://localhost:3001/', wait_until='networkidle')
    page.wait_for_timeout(1500)
    
    os.makedirs('g:/code/from_anothers_view/screenshots', exist_ok=True)
    
    page.screenshot(path='g:/code/from_anothers_view/screenshots/home-initial.png', full_page=False)
    print("首页初始截图已保存")
    
    try:
        start_btn = page.locator('.cocoon-start-btn')
        if start_btn.is_visible(timeout=3000):
            print("引导弹窗显示正常")
            print(f"按钮文本: {start_btn.inner_text()}")
            
            question = page.locator('.cocoon-question')
            sub_q = page.locator('.cocoon-sub-question')
            if question.is_visible():
                print(f"主问题: {question.inner_text()}")
            if sub_q.is_visible():
                print(f"子问题: {sub_q.inner_text()}")
            
            page.screenshot(path='g:/code/from_anothers_view/screenshots/onboarding-modal.png', full_page=False)
            
            start_btn.click()
            page.wait_for_timeout(1000)
            page.screenshot(path='g:/code/from_anothers_view/screenshots/after-modal-close.png', full_page=True)
            print("点击开始破茧按钮后截图已保存")
    except Exception as e:
        print(f"引导弹窗可能已完成过: {e}")
        page.screenshot(path='g:/code/from_anothers_view/screenshots/home-no-modal.png', full_page=True)
    
    browser.close()
    print("测试完成")
