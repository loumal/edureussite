"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc/client";
import type { JeuCatalog } from "@/lib/jeux/catalog";
import { SFX, categoryToMusicTheme } from "@/lib/jeux/sounds";
import { JeuSerpent } from "./jeu-serpent";
import { JeuTetris } from "./jeu-tetris";
import { JeuDino } from "./jeu-dino";
import { JeuFlappy } from "./jeu-flappy";
import { JeuSpaceInvaders } from "./jeu-space-invaders";
import { JeuAsteroides } from "./jeu-asteroides";
import { JeuFruitNinja } from "./jeu-fruit-ninja";
import { Jeu2048 } from "./jeu-2048";
import { JeuMemoire } from "./jeu-memoire";
import { JeuSimon } from "./jeu-simon";
import { JeuMatch3 } from "./jeu-match3";
import { JeuPacDot } from "./jeu-pac-dot";
import { JeuPendu } from "./jeu-pendu";
import { JeuPixelArt } from "./jeu-pixel-art";
import { JeuDemineur } from "./jeu-demineur";
// Arcade groupe 1
import { JeuCasseBriques } from "./jeu-casse-briques";
import { JeuPong } from "./jeu-pong";
import { JeuPuzzleGlissant } from "./jeu-puzzle-glissant";
import { JeuFrappeTaupe } from "./jeu-frappe-taupe";
import { JeuPlatformer } from "./jeu-platformer";
import { JeuTowerDefense } from "./jeu-tower-defense";
// Arcade groupe 2
import { JeuBubbleShooter } from "./jeu-bubble-shooter";
import { JeuLabyrinthe } from "./jeu-labyrinthe";
import { JeuNinjaRun } from "./jeu-ninja-run";
import { JeuSkiSlalom } from "./jeu-ski-slalom";
import { JeuFishing } from "./jeu-fishing";
import { JeuJetpack } from "./jeu-jetpack";
import { JeuTirArc } from "./jeu-tir-arc";
import { JeuBasketball } from "./jeu-basketball";
import { JeuCuisinier } from "./jeu-cuisinier";
import { JeuConstruction } from "./jeu-construction";
// Arcade groupe 3
import { JeuBilleRebond } from "./jeu-bille-rebond";
import { JeuCourseVoiture } from "./jeu-course-voiture";
import { JeuGomoku } from "./jeu-gomoku";
import { JeuSokoban } from "./jeu-sokoban";
import { JeuCourseInfinie } from "./jeu-course-infinie";
import { JeuZombie } from "./jeu-zombie";
import { JeuGalaxie } from "./jeu-galaxie";
import { JeuCartesBataille } from "./jeu-cartes-bataille";
import { JeuDonjon } from "./jeu-donjon";
// Jeux éducatifs
import { JeuCalculMental } from "./jeu-calcul-mental";
import { JeuMultiplication } from "./jeu-multiplication";
import { JeuGeoQuiz } from "./jeu-geo-quiz";
import { JeuFractionFighter } from "./jeu-fraction-fighter";
import { JeuTypingSpeed } from "./jeu-typing-speed";
import { JeuCouleurMix } from "./jeu-couleur-mix";
import { JeuSudokuJr } from "./jeu-sudoku-jr";
import { JeuMotsMeles } from "./jeu-mots-meles";
import { JeuTangram } from "./jeu-tangram";
import { JeuComingSoon } from "./jeu-coming-soon";
import { JeuPuissance4 } from "./jeu-puissance4";
import { JeuSoccerPenaltys } from "./jeu-soccer-penaltys";
import { JeuHockeyTir } from "./jeu-hockey-tir";
import { JeuEchecs } from "./jeu-echecs";
import { JeuPaintLibre } from "./jeu-paint-libre";
import { JeuOrigami } from "./jeu-origami";

function GameComponent({ jeu, onScore }: { jeu: JeuCatalog; onScore: (s: number) => void }) {
  const props = { onScore };
  switch (jeu.composant) {
    case "JeuSerpent":        return <JeuSerpent {...props} />;
    case "JeuTetris":         return <JeuTetris {...props} blitz={jeu.id === "tetris_blitz"} />;
    case "JeuDino":           return <JeuDino {...props} />;
    case "JeuFlappy":         return <JeuFlappy {...props} />;
    case "JeuSpaceInvaders":  return <JeuSpaceInvaders {...props} />;
    case "JeuAsteroides":     return <JeuAsteroides {...props} />;
    case "JeuFruitNinja":     return <JeuFruitNinja {...props} />;
    case "Jeu2048":           return <Jeu2048 {...props} />;
    case "JeuMemoire":        return <JeuMemoire onScore={onScore} niveau={jeu.id === "memoire_avance" ? "difficile" : "facile"} />;
    case "JeuSimon":          return <JeuSimon {...props} />;
    case "JeuMatch3":         return <JeuMatch3 {...props} />;
    case "JeuPacDot":         return <JeuPacDot {...props} />;
    case "JeuPendu":          return <JeuPendu {...props} />;
    case "JeuPixelArt":       return <JeuPixelArt />;
    case "JeuDemineur":       return <JeuDemineur {...props} />;
    // Arcade groupe 1
    case "JeuCasseBriques":   return <JeuCasseBriques {...props} />;
    case "JeuPong":           return <JeuPong {...props} />;
    case "JeuPuzzleGlissant": return <JeuPuzzleGlissant {...props} />;
    case "JeuFrappeTaupe":    return <JeuFrappeTaupe {...props} />;
    case "JeuPlatformer":     return <JeuPlatformer {...props} />;
    case "JeuTowerDefense":   return <JeuTowerDefense {...props} />;
    // Arcade groupe 2
    case "JeuBubbleShooter":  return <JeuBubbleShooter {...props} />;
    case "JeuLabyrinthe":     return <JeuLabyrinthe {...props} />;
    case "JeuNinjaRun":       return <JeuNinjaRun {...props} />;
    case "JeuSkiSlalom":      return <JeuSkiSlalom {...props} />;
    case "JeuFishing":        return <JeuFishing {...props} />;
    case "JeuJetpack":        return <JeuJetpack {...props} />;
    case "JeuTirArc":         return <JeuTirArc {...props} />;
    case "JeuBasketball":     return <JeuBasketball {...props} />;
    case "JeuCuisinier":      return <JeuCuisinier {...props} />;
    case "JeuConstruction":   return <JeuConstruction {...props} />;
    // Arcade groupe 3
    case "JeuBilleRebond":    return <JeuBilleRebond {...props} />;
    case "JeuCourseVoiture":  return <JeuCourseVoiture {...props} />;
    case "JeuGomoku":         return <JeuGomoku {...props} />;
    case "JeuSokoban":        return <JeuSokoban {...props} />;
    case "JeuCourseInfinie":  return <JeuCourseInfinie {...props} />;
    case "JeuZombie":         return <JeuZombie {...props} />;
    case "JeuGalaxie":        return <JeuGalaxie {...props} />;
    case "JeuCartesBataille": return <JeuCartesBataille {...props} />;
    case "JeuDonjon":         return <JeuDonjon {...props} />;
    // Jeux éducatifs
    case "JeuCalculMental":   return <JeuCalculMental {...props} />;
    case "JeuMultiplication": return <JeuMultiplication {...props} />;
    case "JeuGeoQuiz":        return <JeuGeoQuiz {...props} />;
    case "JeuFractionFighter":return <JeuFractionFighter {...props} />;
    case "JeuTypingSpeed":    return <JeuTypingSpeed {...props} />;
    case "JeuCouleurMix":     return <JeuCouleurMix {...props} />;
    case "JeuSudokuJr":       return <JeuSudokuJr {...props} />;
    case "JeuMotsMeles":      return <JeuMotsMeles {...props} />;
    case "JeuTangram":        return <JeuTangram {...props} />;
    case "JeuPuissance4":     return <JeuPuissance4 {...props} />;
    case "JeuSoccerPenaltys": return <JeuSoccerPenaltys {...props} />;
    case "JeuHockeyTir":      return <JeuHockeyTir {...props} />;
    case "JeuEchecs":         return <JeuEchecs {...props} />;
    case "JeuPaintLibre":     return <JeuPaintLibre {...props} />;
    case "JeuOrigami":        return <JeuOrigami {...props} />;
    default:                  return <JeuComingSoon jeu={jeu} />;
  }
}

interface JeuPlayerProps {
  jeu: JeuCatalog;
  demandeId: string;
  minutesAccordees: number;
}

export function JeuPlayer({ jeu, demandeId, minutesAccordees }: JeuPlayerProps) {
  const totalSeconds = minutesAccordees * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [sessionScore, setSessionScore] = useState(0);
  const [ended, setEnded] = useState(false);
  const [started, setStarted] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [xpFlash, setXpFlash] = useState(false);
  const debutRef = useRef<Date | null>(null);
  const sessionScoreRef = useRef(0);
  const endedRef = useRef(false);

  const terminer = trpc.eleve.terminerJeu.useMutation();
  const demarrer = trpc.eleve.demarrerJeu.useMutation({
    onSuccess: (data) => {
      debutRef.current = new Date(data.debutPartieAt);
      const elapsed = (Date.now() - debutRef.current.getTime()) / 1000;
      const remaining = Math.max(0, totalSeconds - elapsed);
      setSecondsLeft(Math.floor(remaining));
      setStarted(true);
      // Flash XP cost to show deduction
      setXpFlash(true);
      setTimeout(() => setXpFlash(false), 2000);
      // Start music
      SFX.music.start(categoryToMusicTheme(jeu.categorie));
      if (remaining <= 0) handleEnd();
    },
  });

  const handleEnd = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    setEnded(true);
    SFX.music.stop();
    terminer.mutate({ demandeId, score: sessionScoreRef.current });
  }, [demandeId, terminer]);

  const handleScore = useCallback((s: number) => {
    sessionScoreRef.current = s;
    setSessionScore(s);
  }, []);

  // Save score ref on change
  useEffect(() => { sessionScoreRef.current = sessionScore; }, [sessionScore]);

  useEffect(() => {
    demarrer.mutate({ demandeId });
    // Send terminerJeu on tab close — XP already deducted but mark as TERMINE
    const onUnload = () => {
      if (!endedRef.current) {
        endedRef.current = true;
        SFX.music.stop();
        navigator.sendBeacon(`/api/trpc/eleve.terminerJeu`, JSON.stringify({ demandeId, score: sessionScoreRef.current }));
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => { window.removeEventListener("beforeunload", onUnload); SFX.music.stop(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!started) return;
    if (secondsLeft <= 0) { handleEnd(); return; }

    const interval = setInterval(() => {
      if (!debutRef.current) return;
      const elapsed = (Date.now() - debutRef.current.getTime()) / 1000;
      const remaining = Math.floor(Math.max(0, totalSeconds - elapsed));
      setSecondsLeft(remaining);
      if (remaining <= 0) { clearInterval(interval); handleEnd(); }
    }, 1000);

    return () => clearInterval(interval);
  }, [started, handleEnd, totalSeconds]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const pct = (secondsLeft / totalSeconds) * 100;
  const urgent = pct < 20;

  if (ended) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 px-4 text-center">
        <span className="text-6xl">{jeu.emoji}</span>
        <h2 className="text-2xl font-black text-white">Session terminée !</h2>
        <div className="rounded-2xl bg-white/5 border border-white/10 px-8 py-6 space-y-2">
          <p className="text-white/60 text-sm">Score final</p>
          <p className="text-4xl font-black text-yellow-400">{sessionScore}</p>
          <p className="text-white/40 text-xs mt-2">Reviens après tes exercices pour rejouer !</p>
        </div>
        <a href="/eleve/boutique?onglet=jeux" className="rounded-2xl bg-white/10 px-6 py-3 text-white font-bold hover:bg-white/20">
          ← Retour aux jeux
        </a>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="w-8 h-8 rounded-full border-4 border-white/20 border-t-white animate-spin" />
        <p className="text-white/40 text-sm">Chargement de ta session...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* XP deducted flash */}
      {xpFlash && (
        <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/40 px-4 py-2 animate-pulse">
          <span className="text-amber-400 font-black text-sm">⚡ -{jeu.xpCout} XP déduits</span>
        </div>
      )}

      {/* Timer + music toggle */}
      <div className={`flex items-center justify-between px-4 py-2 rounded-xl ${urgent ? "bg-red-500/20 border border-red-500/40" : "bg-white/5 border border-white/10"}`}>
        <span className="text-white/70 text-sm font-medium">⏱ Temps restant</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setMusicOn(m => {
                const next = !m;
                if (next) SFX.music.start(categoryToMusicTheme(jeu.categorie));
                else SFX.music.stop();
                return next;
              });
            }}
            className="text-lg opacity-60 hover:opacity-100 transition-opacity"
            title={musicOn ? "Couper la musique" : "Activer la musique"}
          >
            {musicOn ? "🎵" : "🔇"}
          </button>
          <span className={`font-black text-lg tabular-nums ${urgent ? "text-red-400 animate-pulse" : "text-white"}`}>
            {mins}:{String(secs).padStart(2, "0")}
          </span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${urgent ? "bg-red-500" : "bg-green-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-2">
        <GameComponent jeu={jeu} onScore={handleScore} />
      </div>

      <button onClick={handleEnd} className="mt-2 rounded-xl bg-white/5 text-white/40 px-4 py-2 text-xs font-medium hover:bg-white/10 hover:text-white/70">
        Terminer la session
      </button>
    </div>
  );
}
