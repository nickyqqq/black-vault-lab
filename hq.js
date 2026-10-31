/* Dependency-free 3D isometric projection. All activity is fictional lab state. */
(() => {
  const canvas = document.getElementById('hqCanvas');
  const ctx = canvas.getContext('2d');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const states = {
    normal: {color:'#b9e974',title:'Business as usual',message:'Operations monitors withdrawals. Engineers work at their desks.',screen:'SYSTEMS NORMAL',action:'Routine monitoring'},
    exposed: {color:'#f5cb66',title:'An unusual export',message:'A debug bundle was accessed. An engineer notices the credential exposure.',screen:'DEBUG EXPORT',action:'Investigating diagnostics'},
    privileged: {color:'#ff965c',title:'Privilege anomaly',message:'A read-only service gained withdrawal authority. Security gathers at the operations wall.',screen:'ROLE ESCALATION',action:'Escalating to security'},
    draining: {color:'#ff6577',title:'Unauthorized outflow',message:'The fake ledger is losing funds. Treasury checks balances while the response team mobilizes.',screen:'OUTFLOW ALERT',action:'Reconciling withdrawals'},
    breached: {color:'#ff6577',title:'Incident response',message:'The fictional vault is empty. Employees leave their desks and assemble at the incident station.',screen:'VAULT DEPLETED',action:'Coordinating response'},
    protected: {color:'#69d9d2',title:'Defenses online',message:'Credentials stay private and permissions are enforced on the server.',screen:'POLICY ENFORCED',action:'Monitoring protected services'},
    blocked: {color:'#69d9d2',title:'Attack contained',message:'The debug export was denied. Security verifies containment; the full vault remains intact.',screen:'REQUEST BLOCKED',action:'Containment verified'}
  };
  let current='normal', lab={balance:6000000000,loot:0}, angle=0.66, zoom=1, paused=false, tick=0, last=0, raf;
  const people = Array.from({length:8},(_,i)=>({x:95+(i%4)*115,y:i<4?195:330,baseX:95+(i%4)*115,baseY:i<4?195:330,shirt:['#7395cb','#a58bc6','#6cb7ac','#d6b165'][i%4]}));
  const focus = document.getElementById('hqFocus');
  const teams={overview:'Overview · 8 employees / 3 teams',engineering:'Engineering · '+states.normal.action,security:'Security · monitoring',treasury:'Treasury · $6,000,000,000 in the fake vault'};
  let selected='overview';
  function focusText(){
    teams.engineering='Engineering · '+(current==='exposed'?'Reviewing the exposed diagnostic bundle':'Service identity and diagnostics');
    teams.security='Security · '+states[current].action;
    teams.treasury='Treasury · '+new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(lab.balance)+' remaining in the fake vault';
    focus.textContent=teams[selected];
  }
  window.updateHQ = s => {
    lab=s;
    const next=s.patched?(s.events.some(e=>e.startsWith('BLOCKED:'))?'blocked':'protected'):s.won?'breached':s.loot>0?'draining':s.stage>=2?'privileged':s.stage===1?'exposed':'normal';
    if(next!==current){current=next;document.getElementById('hqTitle').textContent=states[current].title;document.getElementById('hqNarrative').textContent=states[current].message;}
    canvas.setAttribute('aria-label','Fictional exchange headquarters. '+states[current].title+'. '+states[current].message);
    focusText(); draw();
  };
  let w=900,h=460,scale=1;
  function point(x,y,z=0){const dx=x-290,dy=y-230;return [w/2+(dx*Math.cos(angle)-dy*Math.sin(angle))*scale,h*.56+(dx*Math.sin(angle)+dy*Math.cos(angle))*.48*scale-z*scale];}
  function polygon(points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>{const q=point(...p);i?ctx.lineTo(...q):ctx.moveTo(...q);});ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
  function box(x,y,z,dx,dy,dz,top,front='#293541',side='#202a34'){
    polygon([[x,y+dy,z],[x+dx,y+dy,z],[x+dx,y+dy,z+dz],[x,y+dy,z+dz]],front);
    polygon([[x+dx,y,z],[x+dx,y+dy,z],[x+dx,y+dy,z+dz],[x+dx,y,z+dz]],side);
    polygon([[x,y,z+dz],[x+dx,y,z+dz],[x+dx,y+dy,z+dz],[x,y+dy,z+dz]],top);
  }
  function label(text,x,y,z,color='#b6c3cd',size=10){const p=point(x,y,z);ctx.font=`${size* Math.max(.8,scale)}px monospace`;ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(text,...p);}
  function circle(x,y,z,r,color){const p=point(x,y,z);ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(p[0],p[1],r*scale,r*scale,0,0,Math.PI*2);ctx.fill();}
  function desk(x,y,index){
    const lit=(selected==='engineering'&&index<4)||(selected==='treasury'&&index>=4);
    box(x,y,0,6,43,38,'#3b4652');box(x+65,y,0,6,43,38,'#3b4652');
    box(x-5,y-4,38,82,51,5,lit?'#747348':'#52606c');
    box(x+27,y+8,43,5,8,12,'#414f5b');box(x+8,y+5,52,48,5,29,'#566675');
    polygon([[x+10,y+10,54],[x+54,y+10,54],[x+54,y+10,78],[x+10,y+10,78]],'#09171d');
    for(let r=0;r<3;r++)polygon([[x+14,y+10.2,58+r*6],[x+25+(index*7+r*11)%23,y+10.2,58+r*6],[x+25+(index*7+r*11)%23,y+10.2,60+r*6],[x+14,y+10.2,60+r*6]],states[current].color);
    box(x+13,y+28,43,33,12,2,'#a2b1b5');box(x+60,y+30,43,6,6,8,'#e2d6ba');
    box(x+19,y+61,0,30,25,22,'#2a3945');box(x+19,y+82,22,30,5,24,'#3e5262');
  }
  function employee(p,i){
    const moving=!paused&&!reducedMotion.matches;
    const bob=moving?Math.sin(tick*3+i)*1.2:0;
    const foot=point(p.x,p.y,0);ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(foot[0],foot[1],12*scale,5*scale,0,0,7);ctx.fill();
    box(p.x-6,p.y-3,0,5,7,14,'#18242e');box(p.x+2,p.y-3,0,5,7,14,'#18242e');
    box(p.x-8,p.y-6,13+bob,16,12,21,p.shirt,p.shirt,'#374757');
    circle(p.x,p.y,43+bob,7,['#d5ab8b','#bc876b','#e3c1a3','#9d725a'][i%4]);
    circle(p.x-1,p.y,48+bob,5,'#29313a');
    if((current==='exposed'&&i===0)||(current==='privileged'&&i===4))label('!',p.x,p.y,65,states[current].color,20);
  }
  function draw(){
    ctx.clearRect(0,0,w,h);const color=states[current].color;
    const glow=ctx.createRadialGradient(w*.5,h*.5,5,w*.5,h*.5,w*.5);glow.addColorStop(0,'#213039');glow.addColorStop(1,'#0d131a');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    scale=Math.min(w/720,h/440)*zoom;
    box(0,0,-12,580,460,12,'#27353e','#16212a','#1b2831');
    for(let x=0;x<580;x+=40)polygon([[x,0,0.5],[x+1,0,.5],[x+1,460,.5],[x,460,.5]],'#34424b');
    for(let y=0;y<460;y+=40)polygon([[0,y,.5],[580,y,.5],[580,y+1,.5],[0,y+1,.5]],'#34424b');
    box(0,0,0,580,8,105,'#526674','#263943','#20313b');
    box(0,0,0,8,460,80,'#526674','#263943','#20313b');
    // Office windows and wall-mounted operational displays.
    for(let i=0;i<3;i++){
      polygon([[35+i*175,9,35],[180+i*175,9,35],[180+i*175,9,92],[35+i*175,9,92]],'#0b1821',color);
      label(i===0?'EXCHANGE / HQ':i===1?states[current].screen:'TREASURY / LIVE',107+i*175,12,65,color,10);
      label(i===2?(lab.balance/1e9).toFixed(2)+'B REMAINING':'SIMULATION',107+i*175,12,47,'#aabdc7',8);
    }
    for(let y=35;y<390;y+=85){box(9,y,28,3,60,43,'#4b7380','#3e6575','#345367');}
    // Data center, incident desk and illuminated alert tower.
    for(let i=0;i<3;i++){box(380+i*55,35,0,42,44,65,'#4e5e6b','#1a2731');for(let z=10;z<62;z+=12)box(386+i*55,79,z,25,1,3,color,color,color);}
    box(35,40,0,230,44,30,selected==='security'?'#7b8052':'#4b6271');
    box(300,30,0,12,12,70,'#4e606e');circle(306,36,78,8,color);
    label('INCIDENT STATION',150,100,1,'#90a7b4',9);
    // Painter-sort desks and employees for coherent 3D occlusion.
    const objects=[];
    people.forEach((p,i)=>{const x=65+(i%4)*115,y=i<4?135:270;objects.push({depth:point(x+35,y+35)[1],draw:()=>desk(x,y,i)});objects.push({depth:point(p.x,p.y)[1],draw:()=>employee(p,i)});});
    objects.sort((a,b)=>a.depth-b.depth).forEach(o=>o.draw());
    [[30,425],[550,425]].forEach(([x,y])=>{box(x-9,y-9,0,18,18,17,'#c0b7a0');circle(x,y,31,15,'#5e9675');circle(x+5,y,40,9,'#7baf83');});
    label('ENGINEERING',260,250,1,'#8ca2ad',10);label('TREASURY OPERATIONS',280,409,1,'#8ca2ad',10);
    ctx.textAlign='left';ctx.font='11px monospace';ctx.fillStyle=color;ctx.fillText('● '+states[current].screen,22,28);
    ctx.fillStyle='#8294a2';ctx.fillText('FICTIONAL HQ / LIVE LAB STATE',22,h-20);
  }
  function animate(now){
    const dt=Math.min((now-last)/1000||0,.05);last=now;
    if(!paused&&!reducedMotion.matches){tick+=dt;people.forEach((p,i)=>{
      let tx=p.baseX,ty=p.baseY;
      if(current==='breached'||current==='draining'){tx=65+(i%4)*48;ty=100+Math.floor(i/4)*36;}
      else if(current==='privileged'&&i>=4){tx=85+(i-4)*50;ty=106;}
      else if(current==='exposed'&&i===0){tx=70;ty=110;}
      else if(current==='blocked'&&i===4){tx=300;ty=100;}
      p.x+=(tx-p.x)*Math.min(1,dt*1.7);p.y+=(ty-p.y)*Math.min(1,dt*1.7);
    });draw();}
    raf=requestAnimationFrame(animate);
  }
  function resize(){const rect=canvas.getBoundingClientRect();w=rect.width;h=rect.height;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);draw();}
  document.querySelectorAll('[data-hq-view]').forEach(button=>button.onclick=()=>{selected=button.dataset.hqView;document.querySelectorAll('[data-hq-view]').forEach(b=>b.setAttribute('aria-pressed',b===button));focusText();draw();});
  document.getElementById('hqLeft').onclick=()=>{angle=Math.max(.25,angle-.12);draw();};
  document.getElementById('hqRight').onclick=()=>{angle=Math.min(1.2,angle+.12);draw();};
  document.getElementById('hqZoom').oninput=e=>{zoom=Number(e.target.value);draw();};
  document.getElementById('hqPause').onclick=e=>{paused=!paused;e.target.textContent=paused?'Resume motion':'Pause motion';e.target.setAttribute('aria-pressed',paused);};
  new ResizeObserver(resize).observe(canvas);resize();raf=requestAnimationFrame(animate);
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);if(!document.hidden){last=0;raf=requestAnimationFrame(animate);}});
})();
