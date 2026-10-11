const nv=document.getElementById('nav');
addEventListener('scroll',()=>nv.classList.toggle('scrolled',scrollY>8),{passive:true});
