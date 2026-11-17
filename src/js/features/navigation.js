/** Lab view navigation — shows only the selected laboratory (hash-based routing). */
export function initNavigation(){
    const labs = Array.from(document.querySelectorAll('.lab'));
    const links = Array.from(document.querySelectorAll('.tabs a[href^="#lab"]'));
    function showLab(id){
      const target = document.getElementById(id);
      if(!target) id='lab1';
      labs.forEach(lab=>lab.classList.toggle('lab-active', lab.id===id));
      const hero=document.getElementById('heroIntro');
      if(hero) hero.style.display = id==='lab1' ? '' : 'none';
      links.forEach(link=>{
        const active = link.getAttribute('href') === '#'+id;
        link.classList.toggle('active', active);
        link.setAttribute('aria-current', active ? 'page' : 'false');
      });
    }
    links.forEach(link=>link.addEventListener('click', e=>{
      e.preventDefault();
      const id=link.getAttribute('href').slice(1);
      history.pushState(null,'','#'+id);
      showLab(id);
      window.scrollTo({top:0, behavior:'smooth'});
    }));
    window.addEventListener('hashchange', ()=>showLab(location.hash.slice(1)||'lab1'));
    showLab(location.hash.slice(1)||'lab1');
}
