// Apply the saved appearance before the page paints. Research data always comes from data.js.
(()=>{
 const key='rap-explorer-appearance';
 let theme='dark';
 try{if(localStorage.getItem(key)==='light')theme='light';}catch{}
 document.documentElement.dataset.theme=theme;
 document.addEventListener('DOMContentLoaded',()=>{
  const button=document.getElementById('theme-toggle');
  function update(){const dark=document.documentElement.dataset.theme==='dark';button.textContent=dark?'Light mode':'Dark mode';button.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');}
  button.addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;try{localStorage.setItem(key,next);}catch{}update();});
  update();
 });
})();
