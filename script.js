let expr = ''; let isDeg = true; let lastAns = 0;
const exprEl = document.getElementById('expr');
const resEl = document.getElementById('result');
const modeEl = document.getElementById('mode');

function update(){ exprEl.textContent = expr || '0'; }

function toggleAngle(){
  isDeg = !isDeg;
  modeEl.textContent = `Mode: ${isDeg ? 'DEG' : 'RAD'} | Tap CAT untuk =`;
  document.querySelector('.header span').textContent = isDeg ? 'DEG • SCI' : 'RAD • SCI';
  const degBtn = document.querySelector('.grid button');
  if(degBtn) degBtn.textContent = isDeg ? 'DEG' : 'RAD';
}

function insert(v){
  if(v === 'a/b') v = '/';
  if(expr === '0' && /[0-9πe.]/.test(v)) expr = '';
  expr += v;
  update();
}

function clearAll(){
  expr = '';
  resEl.textContent = '0';
  modeEl.textContent = `Mode: ${isDeg ? 'DEG' : 'RAD'} | Tap CAT untuk =`;
  update();
}

function del(){
  expr = expr.slice(0, -1);
  update();
}

// Fungsi faktorial aman
function factorial(n){
  if(n < 0) return NaN;
  if(Math.abs(n - Math.round(n)) > 1e-9) return NaN; // Hanya integer
  n = Math.round(n);
  if(n === 0 || n === 1) return 1;
  let r = 1;
  for(let i = 2; i <= n; i++) r *= i;
  return r;
}

// Wrapper Trigonometri
function calcSin(x){ return isDeg ? Math.sin(x * Math.PI / 180) : Math.sin(x); }
function calcCos(x){ return isDeg ? Math.cos(x * Math.PI / 180) : Math.cos(x); }
function calcTan(x){ return isDeg ? Math.tan(x * Math.PI / 180) : Math.tan(x); }

function parseExpression(input) {
  let e = input;
  
  // 1. Ganti operator dasar & konstanta
  e = e.replace(/×/g, '*').replace(/÷/g, '/');
  e = e.replace(/π/g, 'Math.PI').replace(/\be\b/g, 'Math.E');
  e = e.replace(/ANS/g, `(${lastAns})`);
  e = e.replace(/²/g, '**2');
  e = e.replace(/\^/g, '**');

  // 2. Perkalian Implisit (misal: 2π -> 2*Math.PI, 3(4) -> 3*(4), 5sin -> 5*sin)
  e = e.replace(/(\d)(\()\vert{}(\))(\d)|(\d)(Math\.PI|Math\.E|calcSin|calcCos|calcTan|Math\.log10|Math\.log|Math\.sqrt)/g, '$1$3*$2$4');

  // 3. Ganti fungsi matematika
  e = e.replace(/sin\(/g, 'calcSin(');
  e = e.replace(/cos\(/g, 'calcCos(');
  e = e.replace(/tan\(/g, 'calcTan(');
  e = e.replace(/log\(/g, 'Math.log10(');
  e = e.replace(/ln\(/g, 'Math.log(');
  e = e.replace(/√\(/g, 'Math.sqrt(');

  // 4. Operasi Persen (%)
  // Menangani kasus persen gabungan seperti '100+10%' menjadi '100+(100*10/100)'
  e = e.replace(/(\d+(?:\.\d+)?)\s*([+\-])\s*(\d+(?:\.\d+)?)%/g, '$1 $2 ($1 * ($3 / 100))');
  // Menangani persen tunggal seperti '50%' -> '(50/100)'
  e = e.replace(/([0-9.a-zA-Z]+|\([^)]+\))%/g, '($1/100)');

  // 5. Faktorial (!) -> membalut operand di kirinya
  let prevE;
  do {
    prevE = e;
    e = e.replace(/([0-9.a-zA-Z]+|\([^)]+\))!/g, 'factorial($1)');
  } while (e !== prevE);

  return e;
}

function calculate(){
  if(!expr.trim()) return;
  try{
    let parsedExpr = parseExpression(expr);
    
    // Evaluasi fungsi matematis dengan konteks aman
    let val = new Function('factorial', 'calcSin', 'calcCos', 'calcTan', 'Math', `return ${parsedExpr}`)(
      factorial, calcSin, calcCos, calcTan, Math
    );

    if (val === undefined || isNaN(val) || !isFinite(val)) {
      resEl.textContent = 'Error';
      return;
    }

    // Pembulatan presisi floating point
    val = Math.round((val + Number.EPSILON) * 1e12) / 1e12;
    
    resEl.textContent = val.toLocaleString('id-ID');
    lastAns = val;

    // Tampilkan pecahan sederhana jika angka desimal
    if(Math.abs(val) < 1000 && val % 1 !== 0){
      let frac = toFraction(val);
      if(frac) modeEl.textContent = `≈ ${frac} | Mode: ${isDeg ? 'DEG' : 'RAD'}`;
      else modeEl.textContent = `Mode: ${isDeg ? 'DEG' : 'RAD'} | Tap CAT untuk =`;
    } else {
      modeEl.textContent = `Mode: ${isDeg ? 'DEG' : 'RAD'} | Tap CAT untuk =`;
    }
  }catch(err){
    resEl.textContent = 'Error';
  }
}

function toFraction(x){
  let tol = 1e-6; 
  let h1=1, h2=0, k1=0, k2=1; 
  let b = x;
  do{ 
    let a = Math.floor(b); 
    let aux = h1; h1 = a * h1 + k1; k1 = aux; 
    aux = k2; k2 = a * k2 + h2; h2 = aux; 
    b = 1 / (b - a); 
  } while(Math.abs(x - h1 / k2) > Math.abs(x) * tol && k2 < 1000);
  
  if(k2 > 1 && k2 < 100) return h1 + '/' + k2; 
  return null;
}

// Support Keyboard Shortcut
document.addEventListener('keydown', e => { 
  if(/[0-9+\-*/().^!%]/.test(e.key)){ 
    insert(e.key); 
  } else if(e.key === 'Enter'){ 
    e.preventDefault();
    calculate(); 
  } else if(e.key === 'Backspace'){ 
    del(); 
  } else if(e.key === 'Escape'){
    clearAll();
  }
});

update();