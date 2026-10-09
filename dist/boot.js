// A failed module download must leave a usable recovery path, not an empty page.
import('./app.js').catch(()=>{
 const root=document.getElementById('app');
 root.innerHTML='<main class="boot-screen"><img src="./favicon.svg" alt=""><h1>Let’s reconnect your workspace</h1><p>Some application files could not load. Check your connection and try again.</p><button id="retry-start" class="primary">Reload workspace</button><a href="./docs/presentation.pdf">Read the project presentation</a></main>';
 document.getElementById('retry-start').onclick=()=>location.reload();
});
