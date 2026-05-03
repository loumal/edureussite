"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const W = 480, H = 320, PAD_W = 80, PAD_H = 10, BALL_R = 7;
const COLS = 10, ROWS = 5, BW = 44, BH = 18, BGAP = 2;
const COLORS = ["#ef4444","#f97316","#eab308","#22c55e","#3b82f6"];

export function JeuCasseBriques({ onScore }: { onScore?: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    padX: W/2-PAD_W/2, ballX: W/2, ballY: H-60, vx: 3.5, vy: -4,
    score: 0, lives: 3, level: 1, alive: true, started: false,
    bricks: [] as {x:number;y:number;hp:number;color:string}[],
    particles: [] as {x:number;y:number;vx:number;vy:number;life:number;color:string}[],
  });
  const [info, setInfo] = useState({ score: 0, lives: 3 });
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);
  const animRef = useRef(0);

  const makeBricks = (level: number) => {
    const b = [];
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        b.push({ x: c*(BW+BGAP)+4, y: r*(BH+BGAP)+36, hp: level>2&&r<2?2:1, color:COLORS[r] });
    st.current.bricks = b;
  };

  const resetBall = () => {
    const s = st.current;
    s.ballX = s.padX + PAD_W/2; s.ballY = H-60;
    const spd = 3.5 + s.level*0.3;
    s.vx = (Math.random()>0.5?1:-1)*spd; s.vy = -(4+s.level*0.2);
  };

  const loop = useCallback(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const s = st.current;

    const bg = ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,"#0f0c29"); bg.addColorStop(1,"#302b63");
    ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
    for(let i=0;i<W;i+=40){ctx.strokeStyle="rgba(255,255,255,0.03)";ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,H);ctx.stroke();}

    // Bricks
    s.bricks.forEach(b=>{
      if(b.hp<=0)return;
      ctx.fillStyle = b.hp>1 ? "#fff" : b.color;
      ctx.beginPath(); ctx.roundRect(b.x,b.y,BW,BH,3); ctx.fill();
      if(b.hp===1){ctx.fillStyle="rgba(255,255,255,0.2)"; ctx.fillRect(b.x+3,b.y+2,BW-6,4);}
    });

    // Particles
    s.particles=s.particles.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.2;p.life--;return p.life>0;});
    s.particles.forEach(p=>{ctx.globalAlpha=p.life/20;ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,4,4);});
    ctx.globalAlpha=1;

    // Ball glow
    const g=ctx.createRadialGradient(s.ballX,s.ballY,0,s.ballX,s.ballY,20);
    g.addColorStop(0,"rgba(255,255,200,0.4)");g.addColorStop(1,"transparent");
    ctx.fillStyle=g;ctx.fillRect(s.ballX-20,s.ballY-20,40,40);
    ctx.fillStyle="#fffde7";ctx.beginPath();ctx.arc(s.ballX,s.ballY,BALL_R,0,Math.PI*2);ctx.fill();

    // Paddle
    const pg=ctx.createLinearGradient(s.padX,0,s.padX+PAD_W,0);
    pg.addColorStop(0,"#818cf8");pg.addColorStop(1,"#c084fc");
    ctx.fillStyle=pg;ctx.beginPath();ctx.roundRect(s.padX,H-30,PAD_W,PAD_H,5);ctx.fill();

    if(!s.alive||!s.started)return;

    s.ballX+=s.vx; s.ballY+=s.vy;
    if(s.ballX<BALL_R||s.ballX>W-BALL_R){s.vx*=-1;SFX.tick();}
    if(s.ballY<BALL_R){s.vy*=-1;SFX.tick();}
    if(s.ballY>H-30-BALL_R&&s.ballY<H-20&&s.ballX>s.padX&&s.ballX<s.padX+PAD_W&&s.vy>0){
      const rel=(s.ballX-(s.padX+PAD_W/2))/(PAD_W/2);
      s.vx=rel*5;s.vy=-Math.abs(s.vy);SFX.select();
    }
    if(s.ballY>H){
      s.lives--;setInfo({score:s.score,lives:s.lives});
      if(s.lives<=0){s.alive=false;SFX.lose();setDead(true);return;}
      SFX.miss();resetBall();
    }
    for(const b of s.bricks){
      if(b.hp<=0)continue;
      if(s.ballX>b.x&&s.ballX<b.x+BW&&s.ballY>b.y&&s.ballY<b.y+BH){
        b.hp--;s.vy*=-1;s.score+=10*s.level;onScore?.(s.score);SFX.hit();
        for(let i=0;i<8;i++)s.particles.push({x:b.x+BW/2,y:b.y+BH/2,vx:(Math.random()-.5)*5,vy:(Math.random()-.5)*5,life:20,color:b.color});
        setInfo({score:s.score,lives:s.lives});break;
      }
    }
    if(s.bricks.every(b=>b.hp<=0)){s.level++;makeBricks(s.level);resetBall();SFX.win();}

    animRef.current=requestAnimationFrame(loop);
  }, [onScore]);

  useEffect(()=>{
    makeBricks(1);
    const cv=canvas.current;if(!cv)return;
    const onMove=(e:MouseEvent|TouchEvent)=>{
      const r=cv.getBoundingClientRect();
      const cx="touches"in e?e.touches[0].clientX:e.clientX;
      st.current.padX=Math.max(0,Math.min(W-PAD_W,(cx-r.left)*(W/r.width)-PAD_W/2));
    };
    cv.addEventListener("mousemove",onMove);
    cv.addEventListener("touchmove",onMove as EventListener,{passive:true});
    return()=>{
      cv.removeEventListener("mousemove",onMove);
      cv.removeEventListener("touchmove",onMove as EventListener);
      cancelAnimationFrame(animRef.current);
    };
  },[]);

  const start=()=>{st.current.started=true;setStarted(true);animRef.current=requestAnimationFrame(loop);};

  return(
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-6 text-sm font-bold">
        <span className="text-purple-300">Score: {info.score}</span>
        <span>{"❤️".repeat(info.lives)}</span>
      </div>
      <div className="relative">
        <canvas ref={canvas} width={W} height={H} className="rounded-2xl" style={{maxWidth:"100%",touchAction:"none"}}/>
        {!started&&!dead&&(
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 rounded-2xl">
            <span className="text-5xl">🧱</span>
            <p className="text-white font-black text-xl">Casse-Briques</p>
            <div className="text-white/60 text-sm text-center space-y-1">
              <p>🖱️ Bouge la souris pour diriger la raquette</p>
              <p>📱 Sur mobile, glisse le doigt</p>
              <p>Casse toutes les briques !</p>
            </div>
            <button onClick={start} className="rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-500 px-8 py-3 text-white font-black shadow-lg">🟥 Jouer !</button>
          </div>
        )}
        {dead&&(
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 rounded-2xl">
            <p className="text-3xl font-black text-yellow-400">{info.score} pts</p>
            <button onClick={()=>{
              const s=st.current;s.score=0;s.lives=3;s.alive=true;s.level=1;s.particles=[];
              makeBricks(1);resetBall();setDead(false);setStarted(true);setInfo({score:0,lives:3});
              animRef.current=requestAnimationFrame(loop);
            }} className="rounded-2xl bg-purple-600 px-8 py-3 text-white font-black">Rejouer</button>
          </div>
        )}
      </div>
      <p className="text-white/30 text-xs">Déplace la souris pour bouger la raquette</p>
    </div>
  );
}
