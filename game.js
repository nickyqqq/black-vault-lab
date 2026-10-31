/* Title screen, difficulty selection and guided mission flow. */
(() => {
  let chosen='normal';
  const screens=['titleScreen','chooseScreen','briefScreen'];
  const instructions=[
    ['Get a foothold','Inspect the exchange’s diagnostic artifact. Send the prepared request, then examine the response for something useful.'],
    ['Reach the withdrawal service','Use the credential you discovered to create a service session. Your objective is to obtain withdrawal authority.'],
    ['Capture the vault','Use your privileged session to move the fictional balance to lab:player. Work out which approval check is holding you back.']
  ];
  function screen(id){
    document.getElementById('gameMenu').hidden=id==='game';
    document.getElementById('gameWorld').hidden=id!=='game';
    document.getElementById('gameHeader').hidden=id!=='game';
    document.getElementById('gameFooter').hidden=id!=='game';
    screens.forEach(s=>document.getElementById(s).hidden=s!==id);
    window.scrollTo({top:0,behavior:'instant'});
    const heading=document.querySelector(id==='game'?'#objectiveTitle':`#${id} h1`);
    heading?.focus({preventScroll:true});
  }
  function choose(value){chosen=value;document.querySelectorAll('[data-level]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.level===value));}
  document.getElementById('playGame').onclick=()=>screen('chooseScreen');
  document.getElementById('chooseBack').onclick=()=>screen('titleScreen');
  document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>choose(b.dataset.level));
  document.getElementById('continueBrief').onclick=()=>{
    document.getElementById('briefMode').textContent=chosen.toUpperCase()+' / OPERATION 001';
    document.getElementById('briefHelp').textContent=chosen==='normal'?'Your handler provides progressive hints and a code viewer. Use them whenever you get stuck.':'You are on your own. Hints and the in-game source viewer are disabled. Learn from API responses.';
    screen('briefScreen');
  };
  document.getElementById('briefBack').onclick=()=>screen('chooseScreen');
  document.getElementById('startOperation').onclick=async()=>{
    const button=document.getElementById('startOperation');button.disabled=true;
    document.getElementById('startError').textContent='';
    try{
      const ok=await reset(false,chosen);
      if(!ok)throw Error('Cannot reach the local server. Start python server.py and try again.');
      document.getElementById('resumeGame').hidden=false;screen('game');update();
    }catch(e){document.getElementById('startError').textContent=e.message;}
    finally{button.disabled=false;}
  };
  document.getElementById('menuButton').onclick=()=>screen('titleScreen');
  document.getElementById('resumeGame').onclick=()=>screen('game');
  document.getElementById('openTerminal').onclick=()=>{
    if(state&&!state.won&&!state.patched)selectMission(Math.min(state.stage,2));
    tab(false);document.querySelector('.workspace').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
    document.getElementById('payload').focus({preventScroll:true});
  };
  document.getElementById('nextObjective').onclick=()=>{
    selectMission(Math.min(state.stage,2));tab(false);document.getElementById('payload').focus();update();
  };
  document.getElementById('playAgain').onclick=()=>screen('chooseScreen');
  function update(){
    if(!state)return;
    const i=Math.min(state.stage,2), item=instructions[i];
    document.getElementById('objectiveNumber').textContent=state.patched?'DEFENSE EXERCISE':state.won?'OPERATION COMPLETE':`ACTIVE OBJECTIVE / 0${i+1}`;
    document.getElementById('objectiveTitle').textContent=state.patched?'Test the defenses':state.won?'Vault captured':item[0];
    document.getElementById('objectiveText').textContent=state.patched?'Replay your requests and watch the headquarters contain the attack.':state.won?'You captured all $6 billion in simulated funds. Review the debrief or start a new operation.':item[1];
    document.getElementById('openTerminal').textContent=state.won?'Review terminal ↗':'Open mission terminal ↗';
    document.getElementById('nextObjective').hidden=state.patched||state.won||state.stage<=selected;
    document.getElementById('nextObjective').textContent=`Objective complete → Start mission ${Math.min(state.stage+1,3)}`;
    document.getElementById('gameLevel').textContent=(state.difficulty||'normal').toUpperCase();
  }
  document.addEventListener('lab:render',update);
  choose('normal');screen('titleScreen');
})();
