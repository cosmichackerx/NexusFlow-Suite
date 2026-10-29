const fs = require('fs');
const { paths } = require('./config');
const { log } = require('./logger');

async function applySmartHandlers(page, contextStr) {
  try {
    if (!fs.existsSync(paths.HANDLERS_FILE)) return false;
    const data = JSON.parse(fs.readFileSync(paths.HANDLERS_FILE, 'utf8'));
    const handlers = data.handlers || [];
    let handled = false;
    
    for (let h of handlers) {
       if (h.triggerContexts && h.triggerContexts.includes(contextStr)) {
          // Attempt the action silently
          try {
             if (h.action === 'press_key') {
                await page.keyboard.press(h.key).catch(()=>{});
                log('info', `Smart Handler [${h.name}]: Pressed key '${h.key}'.`);
                handled = true;
             } else if (h.action === 'click_coordinates') {
                const size = page.viewportSize();
                if (size) {
                  // Safe eval using Function for viewport calculations
                  let x = new Function('viewport', `return ${h.x_expr}`)(size) || size.width / 2;
                  let y = new Function('viewport', `return ${h.y_expr}`)(size) || size.height / 2;
                  await page.mouse.click(x, y).catch(()=>{});
                  log('info', `Smart Handler [${h.name}]: Clicked coordinates (${Math.round(x)}, ${Math.round(y)}).`);
                  handled = true;
                }
             } else if (h.action === 'click_selector') {
                const el = page.locator(h.selector).first();
                if (await el.isVisible({ timeout: 500 }).catch(()=>false)) {
                   log('info', `Smart Handler [${h.name}]: Found element, clicking...`);
                   await el.click({ force: h.force }).catch(()=>{});
                   handled = true;
                }
             } else if (h.action === 'evaluate_js') {
                const result = await page.evaluate((script) => {
                   return eval(script);
                }, h.script).catch(()=>{});
                if (result) {
                   log('info', `Smart Handler [${h.name}]: Executed successfully.`);
                   handled = true;
                }
             }
          } catch(err) {
             // Silently ignore individual handler failures so it tries the next
          }
          if (handled) await page.waitForTimeout(500); // brief pause after action
       }
    }
    return handled;
  } catch(e) {
    return false;
  }
}

module.exports = {
  applySmartHandlers
};
