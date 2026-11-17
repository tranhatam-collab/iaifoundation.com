async (page) => {
 const results=[]; const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
 for(const [surface,base] of [['local','http://127.0.0.1:4187'],['production','https://iaifoundation.com']]) {
  for(const locale of ['en','vi']) {
   for(const [band,width,height] of [['desktop',1440,1000],['tablet',834,1112],['mobile',390,844]]) {
    const checks={}; await page.setViewportSize({width,height}); await page.goto(base+(locale==='vi'?'/vi/':'/')); await page.locator('h1').waitFor();
    checks.language=(await page.locator('html').getAttribute('lang'))===locale;
    checks.noHorizontalOverflow=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);
    const toggle=page.locator('.menu-toggle'), menu=page.locator('#mobile-menu');
    if(band==='desktop') {checks.desktopNav=await page.getByRole('navigation').isVisible(); checks.toggleHidden=!(await toggle.isVisible());checks.languageSwitcher=await page.getByRole('link',{name:locale==='en'?'VI':'EN',exact:true}).isVisible();}
    else {
      checks.toggleVisible=await toggle.isVisible(); await toggle.click();checks.open=(await toggle.getAttribute('aria-expanded'))==='true'&&await menu.isVisible();
      checks.menuFits=await menu.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;});
      checks.localeLink=await menu.getByRole('link',{name:locale==='en'?'Tiếng Việt':'English',exact:true}).isVisible();
    }
    await page.screenshot({path:'/private/tmp/iaif-release-987e5d3-9t0tux2r/source/output/playwright/'+surface+'-'+locale+'-'+band+'.png'});
    if(band!=='desktop') {
      await menu.getByRole('link').first().click();checks.closeOnLink=(await toggle.getAttribute('aria-expanded'))==='false'&&!(await menu.isVisible());
      await toggle.click();await page.keyboard.press('Escape');checks.escape=(await toggle.getAttribute('aria-expanded'))==='false';checks.focusRestored=await toggle.evaluate(el=>el===document.activeElement);
      await toggle.click();await page.setViewportSize({width:1440,height:1000});await page.waitForFunction(()=>document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='false');checks.closeOnResize=!(await menu.isVisible());
      await page.setViewportSize({width,height}); await toggle.click();await menu.getByRole('link',{name:locale==='en'?'Tiếng Việt':'English',exact:true}).click();checks.localeNavigation=(await page.locator('html').getAttribute('lang'))===(locale==='en'?'vi':'en');
    }
    results.push({surface,locale,band,width,height,checks,passed:Object.values(checks).every(Boolean)});
   }
  }
 }
 return {browser:'Chrome',results,pageErrors:errors,passed:results.filter(x=>x.passed).length,total:results.length};
}
