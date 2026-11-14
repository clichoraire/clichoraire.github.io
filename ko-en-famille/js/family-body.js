// Corps adapté du fichier gemini-code-1794598758084.html fourni par l’utilisateur.
// Les commandes et le temps restent pilotés par le jeu ; aucun écouteur ni boucle privée.
(function(root){
'use strict';
const B=root.BX,R=B.familyBody={};let ctx,boxer,PALETTE;
    const BASE_PALETTE = {
      skinHighlight: '#ffede0',
      skinLight: '#fbd9c0',
      skinBase: '#f0bc98',
      skinMid: '#dc9c74',
      skinShadow: '#be7952',
      skinDeep: '#9c5b38',
      skinOutline: '#7c4326',

      hairHighlight: '#fef9c3',
      hairLight: '#fde047',
      hairBase: '#eab308',
      hairShadow: '#ca8a04',
      hairDeep: '#a16207',
      hairOutline: '#713f12',

      shirtHighlight: '#fef9c3',
      shirtLight: '#fde047',
      shirtBase: '#facc15',
      shirtShadow: '#eab308',
      shirtFold: '#ca8a04',
      shirtOutline: '#854d0e',

      shortLight: '#3b4759',
      shortBase: '#26303d',
      shortShadow: '#171e26',
      shortDeep: '#0d1217',
      shortOutline: '#090c10',

      gloveHighlight: '#93c5fd',
      gloveLight: '#3b82f6',
      gloveBase: '#2563eb',
      gloveShadow: '#1d4ed8',
      gloveDeep: '#1e3a8a',
      gloveOutline: '#101c42'
    };

    function drawAnatomicalLimb(x1, y1, x2, y2, rStart, rMid, rEnd, muscleType, dir) {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const len = Math.hypot(x2 - x1, y2 - y1);

      ctx.save();
      ctx.translate(x1, y1);
      ctx.rotate(angle);

      const grad = ctx.createLinearGradient(0, -rMid, 0, rMid);
      if (muscleType === 'upperArm') {
        grad.addColorStop(0, PALETTE.skinLight);
        grad.addColorStop(0.35, PALETTE.skinBase);
        grad.addColorStop(0.75, PALETTE.skinMid);
        grad.addColorStop(1, PALETTE.skinShadow);
      } else {
        grad.addColorStop(0, PALETTE.skinHighlight);
        grad.addColorStop(0.4, PALETTE.skinLight);
        grad.addColorStop(0.8, PALETTE.skinBase);
        grad.addColorStop(1, PALETTE.skinMid);
      }

      ctx.beginPath();
      ctx.moveTo(0, -rStart);
      ctx.bezierCurveTo(len * 0.35, -rMid * 1.08, len * 0.65, -rMid * 0.95, len, -rEnd);
      ctx.arc(len, 0, rEnd, -Math.PI / 2, Math.PI / 2);
      ctx.bezierCurveTo(len * 0.65, rMid * 0.95, len * 0.35, rMid * 1.08, 0, rStart);
      ctx.arc(0, 0, rStart, Math.PI / 2, -Math.PI / 2);
      ctx.closePath();

      ctx.fillStyle = grad;
      ctx.fill();


      ctx.lineCap = 'round';
      if (muscleType === 'upperArm') {
        ctx.strokeStyle = 'rgba(156, 91, 56, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(len * 0.3, dir * rMid * 0.14);
        ctx.quadraticCurveTo(len * 0.58, dir * rMid * 0.28, len * 0.85, dir * rMid * 0.08);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 245, 235, 0.42)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(len * 0.25, -dir * rMid * 0.35);
        ctx.quadraticCurveTo(len * 0.52, -dir * rMid * 0.45, len * 0.78, -dir * rMid * 0.25);
        ctx.stroke();
      } else if (muscleType === 'forearm') {
        ctx.strokeStyle = 'rgba(156, 91, 56, 0.32)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(len * 0.18, dir * rMid * 0.2);
        ctx.quadraticCurveTo(len * 0.48, dir * rMid * 0.28, len * 0.75, dir * rMid * 0.05);
        ctx.stroke();
      }

      ctx.restore();
    }

    // NOUVELLE FONCTION : Dessine toute la jambe (cuisse + genou + tibia/mollet) d'UN SEUL BLOC continu !
    // Plus aucune bordure noire/marron horizontale au milieu du genou !
    function drawContinuousLeg(hipX, hipY, ankleX, ankleY, dir, isBackView) {
      const topY = hipY;
      const kneeY = hipY + (ankleY - hipY) * 0.5;
      const kneeX = hipX + (boxer.kneeBend?.[dir < 0 ? 0 : 1] || 0);
      const botY = ankleY;

      // Largeurs anatomiques (demi-largeurs)
      const rHip = 15.5;
      const rKnee = 12.2;
      const rCalf = 13.2;
      const rAnkle = 9.5;

      // Dégradé transversal (lumière douce au centre/extérieur, ombre sur l'intérieur)
      const grad = ctx.createLinearGradient(hipX - dir * 16, topY, hipX + dir * 16, topY);
      grad.addColorStop(0, PALETTE.skinMid);
      grad.addColorStop(0.35, PALETTE.skinLight);
      grad.addColorStop(0.7, PALETTE.skinBase);
      grad.addColorStop(1, PALETTE.skinShadow);

      ctx.fillStyle = grad;
      ctx.beginPath();
      // Haut de la cuisse (caché sous le short)
      ctx.moveTo(hipX - rHip, topY);
      ctx.lineTo(hipX + rHip, topY);

      // Bord droit continu : Cuisse -> creux léger du genou -> galbe du mollet -> cheville
      ctx.bezierCurveTo(
        hipX + rHip * 0.98, topY + (kneeY - topY) * 0.6,
        kneeX + rKnee, kneeY - 6,
        kneeX + rKnee, kneeY
      );
      ctx.bezierCurveTo(
        ankleX + rCalf, kneeY + (botY - kneeY) * 0.35,
        ankleX + rCalf * 0.85, kneeY + (botY - kneeY) * 0.75,
        ankleX + rAnkle, botY
      );

      // Bas de la cheville (caché dans la bottine)
      ctx.lineTo(ankleX - rAnkle, botY);

      // Bord gauche continu : Cheville -> mollet -> genou -> cuisse
      ctx.bezierCurveTo(
        ankleX - rCalf * 0.85, kneeY + (botY - kneeY) * 0.75,
        ankleX - rCalf, kneeY + (botY - kneeY) * 0.35,
        kneeX - rKnee, kneeY
      );
      ctx.bezierCurveTo(
        kneeX - rKnee, kneeY - 6,
        hipX - rHip * 0.98, topY + (kneeY - topY) * 0.6,
        hipX - rHip, topY
      );
      ctx.closePath();
      ctx.fill();


      // --- DÉTAILS ANATOMIQUES DOUX DU GENOU & DU TIBIA (sans couper la jambe) ---
      ctx.lineCap = 'round';
      if (!isBackView) {
        // VUE DE FACE :
        // 1. Léger ombrage du vaste interne (cuisse) au-dessus du genou
        ctx.strokeStyle = 'rgba(156, 91, 56, 0.25)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(hipX - dir * 3, topY + 14);
        ctx.quadraticCurveTo(hipX - dir * 4, kneeY - 12, hipX - dir * 5, kneeY - 6);
        ctx.stroke();

        // 2. Rotule discrète (deux petits arcs très fins et souples, pas un gros rond)
        ctx.strokeStyle = 'rgba(156, 91, 56, 0.32)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        // Haut de la rotule (très léger)
        ctx.arc(hipX, kneeY - 1, 5.5, Math.PI + 0.55, -0.55);
        // Creux sous la rotule
        ctx.moveTo(hipX - 4.5, kneeY + 5);
        ctx.quadraticCurveTo(hipX, kneeY + 7, hipX + 4.5, kneeY + 5);
        ctx.stroke();

        // 3. Reflet lumineux sur le tibia
        ctx.strokeStyle = 'rgba(255, 248, 240, 0.45)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(ankleX + dir * 2, kneeY + 12);
        ctx.lineTo(ankleX + dir * 2, botY - 8);
        ctx.stroke();

      } else {
        // VUE DE DOS :
        // Creux poplité (pli arrière du genou) + séparation douce des jumeaux du mollet
        ctx.strokeStyle = 'rgba(156, 91, 56, 0.34)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(hipX - 6, kneeY - 1);
        ctx.quadraticCurveTo(hipX, kneeY + 2, hipX + 6, kneeY - 1);
        // Sillon vertical entre les deux faisceaux du mollet
        ctx.moveTo(ankleX, kneeY + 8);
        ctx.lineTo(ankleX, kneeY + 24);
        ctx.stroke();
      }
    }

    // =========================================================================
    // 2. GANT DE BOXE
    // =========================================================================

    function drawRealisticGlove(x, y, scale, isLeft, isBackView, tiltAngle) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(tiltAngle);
      ctx.scale(scale, scale);
      if (!isLeft) ctx.scale(-1, 1);

      const cuffGrad = ctx.createLinearGradient(-20, 14, 20, 32);
      cuffGrad.addColorStop(0, PALETTE.gloveBase);
      cuffGrad.addColorStop(1, PALETTE.gloveDeep);

      ctx.fillStyle = cuffGrad;
      ctx.beginPath();
      ctx.roundRect(-19, 13, 38, 19, [3, 3, 7, 7]);
      ctx.fill();

      ctx.fillStyle = PALETTE.gloveShadow;
      ctx.beginPath();
      ctx.roundRect(-16, 17, 32, 10, 3);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (!isBackView) {
        const palmGrad = ctx.createLinearGradient(0, -6, 0, 16);
        palmGrad.addColorStop(0, PALETTE.gloveBase);
        palmGrad.addColorStop(1, PALETTE.gloveDeep);

        ctx.fillStyle = palmGrad;
        ctx.beginPath();
        ctx.roundRect(-22, -8, 42, 23, [8, 8, 12, 12]);
        ctx.fill();

        const knuckleGrad = ctx.createRadialGradient(-6, -18, 3, -2, -12, 28);
        knuckleGrad.addColorStop(0, PALETTE.gloveHighlight);
        knuckleGrad.addColorStop(0.35, PALETTE.gloveLight);
        knuckleGrad.addColorStop(0.75, PALETTE.gloveBase);
        knuckleGrad.addColorStop(1, PALETTE.gloveShadow);

        ctx.fillStyle = knuckleGrad;
        ctx.beginPath();
        ctx.moveTo(-23, -4);
        ctx.bezierCurveTo(-25, -24, -14, -29, 0, -29);
        ctx.bezierCurveTo(15, -29, 22, -22, 20, -5);
        ctx.quadraticCurveTo(0, -1, -23, -4);
        ctx.closePath();
        ctx.fill();

        const thumbGrad = ctx.createLinearGradient(6, -10, 22, 10);
        thumbGrad.addColorStop(0, PALETTE.gloveLight);
        thumbGrad.addColorStop(0.6, PALETTE.gloveBase);
        thumbGrad.addColorStop(1, PALETTE.gloveDeep);

        ctx.fillStyle = thumbGrad;
        ctx.beginPath();
        ctx.moveTo(8, -11);
        ctx.bezierCurveTo(22, -12, 26, 2, 19, 12);
        ctx.bezierCurveTo(13, 16, 6, 10, 7, 1);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.ellipse(-8, -19, 8.5, 3.5, -0.25, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const backGrad = ctx.createRadialGradient(-4, -12, 4, 0, -6, 32);
        backGrad.addColorStop(0, PALETTE.gloveHighlight);
        backGrad.addColorStop(0.3, PALETTE.gloveLight);
        backGrad.addColorStop(0.65, PALETTE.gloveBase);
        backGrad.addColorStop(1, PALETTE.gloveDeep);

        ctx.fillStyle = backGrad;
        ctx.beginPath();
        ctx.moveTo(-20, 14);
        ctx.bezierCurveTo(-25, -4, -22, -27, 0, -27);
        ctx.bezierCurveTo(22, -27, 25, -4, 20, 14);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = PALETTE.gloveShadow;
        ctx.beginPath();
        ctx.ellipse(19, 1, 6.5, 11, 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(16, 28, 66, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -6, 15, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.ellipse(-5, -17, 7, 3, -0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // =========================================================================
    // 3. CINÉMATIQUE DES BRAS
    // =========================================================================

    function getArmCoords(side, breathY, twistX, liftY) {
      if(boxer.arms?.[side])return boxer.arms[side];
      const isLeft = side === 'left';
      const dir = isLeft ? -1 : 1;
      const anim = isLeft ? boxer.leftAnim : boxer.rightAnim;
      const p = anim.val;

      const low = !anim.isHigh && boxer.zone === 'low';
      const verticalReach = anim.isHigh ? 120 : low ? -12 : 62;
      const elbowLift = anim.isHigh ? 82 : low ? 8 : 52;

      const shoulderX = boxer.x + dir * 56 + twistX;
      const shoulderY = boxer.y - 48 + breathY - liftY;

      const elbowX = shoulderX + dir * (15 - p * (anim.isHigh ? 17 : 35));
      const elbowY = shoulderY + (55 - p * elbowLift) + breathY * 0.4;

      const guardSpread = boxer.isBackView ? 45 : 36;
      const guardHeight = boxer.isBackView ? -72 : -54;

      // Chaque frappe converge vers le centre ; les hauteurs restent distinctes.
      const reachX = 13;
      const gloveX = boxer.x + dir * (guardSpread + p * (reachX - guardSpread)) + twistX * 0.8;
      const gloveY = boxer.y + guardHeight - (p * verticalReach) + breathY * 1.1 - liftY;

      const depthDir = boxer.isBackView ? -1 : 1;
      const gloveScale = 1 + (p * (anim.isHigh ? 0.26 : 0.36) * depthDir);
      const baseTilt = boxer.isBackView ? 0.18 : -0.12;
      const tiltAngle = dir * (baseTilt + p * 0.22);

      return { shoulderX, shoulderY, elbowX, elbowY, gloveX, gloveY, gloveScale, tiltAngle, p, isHigh: anim.isHigh };
    }

    // =========================================================================
    // 4. CORPS & VÊTEMENTS
    // =========================================================================

    function drawBodyAndLegs(breathY, twistX, liftY) {
      const x = boxer.x;
      const y = boxer.y - liftY;

      if(boxer.shadow){
      // --- A. OMBRE AU SOL ---
      const shadowScale = 1 - (liftY * 0.015);
      const shadowGrad = ctx.createRadialGradient(x, boxer.y + 182, 10, x, boxer.y + 182, 86 * shadowScale);
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.52)');
      shadowGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.22)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(x, boxer.y + 182, 86 * shadowScale, 19 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();

      }
      // --- B. JAMBES CONTINUES (Sans coupure ni bordure foncée au niveau du genou) ---
      [-1, 1].forEach(dir => {
        const hipX = x + dir * 24;
        const foot=boxer.feet?.[dir<0?0:1];
        const ankleX = foot?foot.x:x + dir * 25 + (boxer.stride||0)*dir;
        drawContinuousLeg(hipX, y + 84, ankleX, foot?foot.y-15:y + 162-Math.max(0,(boxer.stride||0)*dir)*.45, dir, boxer.isBackView);
      });

      // --- C. BOTTINES DE BOXE ---
      [-1, 1].forEach(dir => {
        const foot=boxer.feet?.[dir<0?0:1];
        const bootX = foot?foot.x:x + dir * 25 + (boxer.stride||0)*dir;
        ctx.save();ctx.translate(0,foot?foot.y-(y+177):-Math.max(0,(boxer.stride||0)*dir)*.45);
        const bootGrad = ctx.createLinearGradient(bootX - 16, y + 144, bootX + 16, y + 178);
        bootGrad.addColorStop(0, '#3b4759');
        bootGrad.addColorStop(0.5, '#1e2633');
        bootGrad.addColorStop(1, '#0d121a');

        ctx.fillStyle = bootGrad;
        ctx.beginPath();
        ctx.roundRect(bootX - 15.5, y + 144, 31, 33, [5, 5, 11, 11]);
        ctx.fill();

        ctx.fillStyle = PALETTE.gloveBase;
        ctx.beginPath();
        ctx.roundRect(bootX - 14.5, y + 145, 29, 4.5, 2);
        ctx.fill();

        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.roundRect(bootX - 16, y + 171, 32, 6.5, [1, 1, 9, 9]);
        ctx.fill();

        if (!boxer.isBackView) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(bootX - 4.5, y + 149, 9, 18);

          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1.7;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(bootX - 5, y + 152); ctx.lineTo(bootX + 5, y + 154);
          ctx.moveTo(bootX + 5, y + 152); ctx.lineTo(bootX - 5, y + 154);
          ctx.moveTo(bootX - 5, y + 159); ctx.lineTo(bootX + 5, y + 161);
          ctx.moveTo(bootX + 5, y + 159); ctx.lineTo(bootX - 5, y + 161);
          ctx.stroke();
        } else {
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(bootX, y + 149);
          ctx.lineTo(bootX, y + 170);
          ctx.stroke();
        }
        ctx.restore();
      });

      // --- D. SHORT DE BOXE ---
      const shortGrad = ctx.createLinearGradient(x - 50, y + 48, x + 50, y + 106);
      shortGrad.addColorStop(0, PALETTE.shortLight);
      shortGrad.addColorStop(0.5, PALETTE.shortBase);
      shortGrad.addColorStop(1, PALETTE.shortShadow);

      ctx.fillStyle = shortGrad;
      ctx.beginPath();
      ctx.moveTo(x - 46, y + 52);
      ctx.lineTo(x + 46, y + 52);
      ctx.lineTo(x + 51, y + 102);
      ctx.quadraticCurveTo(x + 26, y + 106, x + 2, y + 102);
      ctx.lineTo(x, y + 96);
      ctx.lineTo(x - 2, y + 102);
      ctx.quadraticCurveTo(x - 26, y + 106, x - 51, y + 102);
      ctx.closePath();
      ctx.fill();

      [-1, 1].forEach(dir => {
        ctx.fillStyle = PALETTE.gloveBase;
        ctx.beginPath();
        ctx.moveTo(x + dir * 46, y + 64);
        ctx.lineTo(x + dir * 41, y + 64);
        ctx.lineTo(x + dir * 44, y + 102);
        ctx.lineTo(x + dir * 50, y + 101);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      const beltGrad = ctx.createLinearGradient(x, y + 46, x, y + 63);
      beltGrad.addColorStop(0, '#1e2633');
      beltGrad.addColorStop(1, '#0f141c');
      ctx.fillStyle = beltGrad;
      ctx.beginPath();
      ctx.roundRect(x - 47, y + 46, 94, 17, [5, 5, 2, 2]);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 45, y + 51); ctx.lineTo(x + 45, y + 51);
      ctx.moveTo(x - 45, y + 58); ctx.lineTo(x + 45, y + 58);
      ctx.stroke();

      if (!boxer.isBackView) {
        ctx.fillStyle = PALETTE.shirtBase;
        ctx.beginPath();
        ctx.roundRect(x - 11, y + 49, 22, 11, 3);
        ctx.fill();
      } else {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x, y + 47);
        ctx.lineTo(x, y + 62);
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(9, 12, 16, 0.55)';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y + 65);
      ctx.lineTo(x, y + 96);
      ctx.moveTo(x - 14, y + 66); ctx.quadraticCurveTo(x - 20, y + 82, x - 24, y + 98);
      ctx.moveTo(x + 14, y + 66); ctx.quadraticCurveTo(x + 20, y + 82, x + 24, y + 98);
      ctx.stroke();

      // --- E. TORSE MUSCULAIRE ---
      const topY = y - 64 + breathY;
      const tx = x + twistX * 0.75;

      const torsoSkinGrad = ctx.createRadialGradient(tx, topY + 12, 8, tx, topY + 18, 62);
      torsoSkinGrad.addColorStop(0, PALETTE.skinLight);
      torsoSkinGrad.addColorStop(0.55, PALETTE.skinBase);
      torsoSkinGrad.addColorStop(1, PALETTE.skinMid);

      ctx.fillStyle = torsoSkinGrad;
      ctx.beginPath();
      ctx.moveTo(tx - 15, topY - 22);
      ctx.quadraticCurveTo(tx - 32, topY - 8, tx - 56, topY + 8);
      ctx.lineTo(tx - 50, topY + 62);
      ctx.lineTo(tx + 50, topY + 62);
      ctx.lineTo(tx + 56, topY + 8);
      ctx.quadraticCurveTo(tx + 32, topY - 8, tx + 15, topY - 22);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(156, 91, 56, 0.42)';
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (!boxer.isBackView) {
        ctx.moveTo(tx - 6, topY + 2);
        ctx.quadraticCurveTo(tx - 22, topY, tx - 40, topY + 6);
        ctx.moveTo(tx + 6, topY + 2);
        ctx.quadraticCurveTo(tx + 22, topY, tx + 40, topY + 6);
      } else {
        ctx.moveTo(tx, topY - 18);
        ctx.lineTo(tx, topY + 6);
        ctx.moveTo(tx - 12, topY - 10);
        ctx.quadraticCurveTo(tx - 26, topY - 2, tx - 42, topY + 6);
        ctx.moveTo(tx + 12, topY - 10);
        ctx.quadraticCurveTo(tx + 26, topY - 2, tx + 42, topY + 6);
        ctx.moveTo(tx - 24, topY + 14);
        ctx.quadraticCurveTo(tx - 38, topY + 24, tx - 36, topY + 42);
        ctx.moveTo(tx + 24, topY + 14);
        ctx.quadraticCurveTo(tx + 38, topY + 24, tx + 36, topY + 42);
      }
      ctx.stroke();

      // --- F. DÉBARDEUR JAUNE ---
      const shirtGrad = ctx.createLinearGradient(tx - 52, topY, tx + 52, topY + 115);
      shirtGrad.addColorStop(0, PALETTE.shirtHighlight);
      shirtGrad.addColorStop(0.35, PALETTE.shirtLight);
      shirtGrad.addColorStop(0.7, PALETTE.shirtBase);
      shirtGrad.addColorStop(1, PALETTE.shirtShadow);

      ctx.fillStyle = shirtGrad;
      ctx.beginPath();

      if (!boxer.isBackView) {
        ctx.moveTo(tx - 34, topY - 3);
        ctx.lineTo(tx - 19, topY - 3);
        ctx.quadraticCurveTo(tx, topY + 24, tx + 19, topY - 3);
        ctx.lineTo(tx + 34, topY - 3);
        ctx.bezierCurveTo(tx + 33, topY + 24, tx + 42, topY + 36, tx + 53, topY + 42);
        ctx.lineTo(tx + 46, topY + 112);
        ctx.quadraticCurveTo(tx, topY + 117, tx - 46, topY + 112);
        ctx.lineTo(tx - 53, topY + 42);
        ctx.bezierCurveTo(tx - 42, topY + 36, tx - 33, topY + 24, tx - 34, topY - 3);
      } else {
        ctx.moveTo(tx - 24, topY - 6);
        ctx.quadraticCurveTo(tx, topY - 3, tx + 24, topY - 6);
        ctx.bezierCurveTo(tx + 16, topY + 12, tx + 11, topY + 26, tx + 13, topY + 38);
        ctx.bezierCurveTo(tx + 24, topY + 46, tx + 42, topY + 48, tx + 52, topY + 52);
        ctx.lineTo(tx + 46, topY + 112);
        ctx.quadraticCurveTo(tx, topY + 117, tx - 46, topY + 112);
        ctx.lineTo(tx - 52, topY + 52);
        ctx.bezierCurveTo(tx - 42, topY + 48, tx - 24, topY + 46, tx - 13, topY + 38);
        ctx.bezierCurveTo(tx - 11, topY + 26, tx - 16, topY + 12, tx - 24, topY - 6);
      }

      ctx.closePath();
      ctx.fill();


      ctx.lineCap = 'round';
      if (!boxer.isBackView) {
        ctx.fillStyle = 'rgba(202, 138, 4, 0.25)';
        ctx.beginPath();
        ctx.ellipse(tx, topY + 24, 18, 7, 0, 0, Math.PI);
        ctx.fill();

        ctx.strokeStyle = PALETTE.shirtFold;
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.moveTo(tx, topY + 28);
        ctx.lineTo(tx, topY + 50);
        ctx.moveTo(tx - 38, topY + 44);
        ctx.quadraticCurveTo(tx - 20, topY + 53, tx - 3, topY + 46);
        ctx.moveTo(tx + 38, topY + 44);
        ctx.quadraticCurveTo(tx + 20, topY + 53, tx + 3, topY + 46);
        ctx.stroke();

        ctx.strokeStyle = PALETTE.shirtShadow;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(tx, topY + 55);
        ctx.lineTo(tx, topY + 102);
        [64, 78, 92].forEach(abY => {
          ctx.moveTo(tx - 16, topY + abY);
          ctx.quadraticCurveTo(tx - 8, topY + abY + 2, tx - 3, topY + abY);
          ctx.moveTo(tx + 16, topY + abY);
          ctx.quadraticCurveTo(tx + 8, topY + abY + 2, tx + 3, topY + abY);
        });
        ctx.stroke();
      } else {
        ctx.strokeStyle = PALETTE.shirtFold;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(tx, topY + 4);
        ctx.lineTo(tx, topY + 105);
        ctx.stroke();

        ctx.strokeStyle = PALETTE.shirtShadow;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(tx - 42, topY + 64);
        ctx.quadraticCurveTo(tx - 26, topY + 82, tx - 14, topY + 104);
        ctx.moveTo(tx + 42, topY + 64);
        ctx.quadraticCurveTo(tx + 26, topY + 82, tx + 14, topY + 104);
        ctx.stroke();
      }
    }

    // =========================================================================
    // 5. TÊTE & CHEVELURE
    // =========================================================================

    function renderSingleArm(side, breathY, twistX, liftY) {
      const isLeft = side === 'left';
      const dir = isLeft ? -1 : 1;
      const c = getArmCoords(side, breathY, twistX, liftY);

      if (!boxer.isBackView) {
        drawAnatomicalLimb(c.shoulderX, c.shoulderY, c.elbowX, c.elbowY, 15, 17, 13.5, 'upperArm', dir);

        const deltGrad = ctx.createRadialGradient(c.shoulderX - dir * 3, c.shoulderY - 4, 2, c.shoulderX, c.shoulderY, 18);
        deltGrad.addColorStop(0, PALETTE.skinLight);
        deltGrad.addColorStop(0.7, PALETTE.skinBase);
        deltGrad.addColorStop(1, PALETTE.skinMid);
        ctx.fillStyle = deltGrad;
        ctx.beginPath();
        ctx.arc(c.shoulderX, c.shoulderY + 1, 16, 0, Math.PI * 2);
        ctx.fill();


        drawAnatomicalLimb(c.elbowX, c.elbowY, c.gloveX, c.gloveY + 18, 14, 15.5, 11.5, 'forearm', dir);
        if(!boxer.bareHands)drawRealisticGlove(c.gloveX, c.gloveY, c.gloveScale, isLeft, false, c.tiltAngle);
        else{ctx.fillStyle=PALETTE.skinLight;ctx.beginPath();ctx.ellipse(c.gloveX,c.gloveY+18,11,13,0,0,Math.PI*2);ctx.fill();}
      } else {
        drawAnatomicalLimb(c.shoulderX, c.shoulderY, c.elbowX, c.elbowY, 16, 18, 13.5, 'upperArm', dir);

        const deltGrad = ctx.createRadialGradient(c.shoulderX - dir * 2, c.shoulderY - 4, 2, c.shoulderX, c.shoulderY, 18);
        deltGrad.addColorStop(0, PALETTE.skinLight);
        deltGrad.addColorStop(0.65, PALETTE.skinBase);
        deltGrad.addColorStop(1, 'rgba(240, 188, 152, 0)');
        ctx.fillStyle = deltGrad;
        ctx.beginPath();
        ctx.arc(c.shoulderX, c.shoulderY + 1, 16, 0, Math.PI * 2);
        ctx.fill();


        ctx.strokeStyle = 'rgba(156, 91, 56, 0.3)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(c.shoulderX, c.shoulderY + 2, 13, isLeft ? 0.3 : Math.PI - 0.8, isLeft ? 1.1 : Math.PI - 0.1);
        ctx.stroke();
      }
    }

    function renderBackLayerForearmAndGlove(side, breathY, twistX, liftY) {
      const isLeft = side === 'left';
      const dir = isLeft ? -1 : 1;
      const c = getArmCoords(side, breathY, twistX, liftY);

      if(!boxer.bareHands)drawRealisticGlove(c.gloveX, c.gloveY, c.gloveScale, isLeft, true, c.tiltAngle);
      else{ctx.fillStyle=PALETTE.skinLight;ctx.beginPath();ctx.ellipse(c.gloveX,c.gloveY+18,11,13,0,0,Math.PI*2);ctx.fill();}
      drawAnatomicalLimb(c.elbowX, c.elbowY, c.gloveX, c.gloveY + 18, 13.5, 14.5, 10.5, 'forearm', dir);
    }

  R.factor=ch=>ch.id==='milo'?.85:1;
  R.headHeight=ch=>ch.id==='milo'?150:136;
  R.punchEnvelope=t=>{t=Math.max(0,Math.min(1,t));return t<.26?Math.sin(t/.26*Math.PI/2):t<.48?1:Math.cos((t-.48)/.52*Math.PI/2);};
  function drawHead(breath,twist,lift){
    const ch=boxer.ch,x=twist*.45,y=-112+breath*.85-lift+boxer.headDrop;
    drawAnatomicalLimb(x,y+29,x,y+53,12,13,14,'upperArm',1);
    const view=boxer.view|| (boxer.isBackView?'back':'front'),img=root.FamilyHeads?.frame(ch.id,view);
    if(img){const h=R.headHeight(ch),w=h*img.width/img.height;ctx.drawImage(img,x-w/2,y-h/2,w,h);}
  }
  R.draw=function(c,ch,x,y,scale,pose={}){
    const A=B.art,old=[ctx,boxer,PALETTE];ctx=c;
    PALETTE={...BASE_PALETTE};
    for(const [prefix,color] of [['shirt',ch.tank],['glove',ch.gloves]])for(const [suffix,amount] of [['Highlight',.5],['Light',.22],['Base',0],['Shadow',-.13],['Fold',-.23],['Deep',-.4],['Outline',-.56]])PALETTE[prefix+suffix]=A.shade(color,amount);
    const left=pose.left||0,right=pose.right||0,twist=(left-right)*9,lift=Math.max(pose.high?left*10:0,pose.high?right*10:0);
    boxer={x:0,y:0,ch,isBackView:pose.view==='back',view:pose.view,leftAnim:{val:left,isHigh:!!pose.high},rightAnim:{val:right,isHigh:!!pose.high},zone:pose.zone,kneeBend:pose.kneeBend,headDrop:pose.headDrop||0,arms:pose.arms,feet:pose.feet,bareHands:pose.bareHands,stride:pose.stride||0,shadow:!!pose.shadow};
    const breath=pose.still?0:Math.sin((pose.time||0)*5)*2.6;
    c.save();c.translate(x,y);c.rotate(pose.rotation||0);c.scale(scale,scale);
    try{
      if(boxer.isBackView){renderBackLayerForearmAndGlove('left',breath,twist,lift);renderBackLayerForearmAndGlove('right',breath,twist,lift);}
      drawBodyAndLegs(breath,twist,lift);drawHead(breath,twist,lift);
      if(pose.element){const g=getArmCoords(pose.side==='L'?'left':'right',breath,twist,lift);c.save();c.translate(g.gloveX,g.gloveY);c.scale(.55,.55);A.drawElementGlove(c,{x:0,y:0},pose.element,pose.time||0);c.restore();}
      const order=left>=right?['right','left']:['left','right'];for(const side of order)renderSingleArm(side,breath,twist,lift);
      if(pose.tied){const l=getArmCoords('left',breath,twist,lift),r=getArmCoords('right',breath,twist,lift);c.strokeStyle='#f06292';c.lineWidth=3;for(let i=0;i<4;i++){c.beginPath();c.moveTo(l.gloveX,l.gloveY+i*6);c.quadraticCurveTo(0,l.gloveY+20+i*6,r.gloveX,r.gloveY+i*6);c.stroke();}}
      if(pose.tired){c.fillStyle='#80c8ee';for(let i=0;i<3;i++){c.beginPath();c.ellipse(-60+i*60,-145+((pose.time||0)*45+i*20)%60,3,5,0,0,Math.PI*2);c.fill();}}
    }finally{c.restore();[ctx,boxer,PALETTE]=old;}
    const hx=twist*.45*scale,hy=(-112+breath*.85-lift+(pose.headDrop||0))*scale,angle=pose.rotation||0;
    return {headX:x+hx*Math.cos(angle)-hy*Math.sin(angle),headY:y+hx*Math.sin(angle)+hy*Math.cos(angle)};
  };
  R.front=function(c,ch,x,y,k,T,sb={}){
    const scale=k*B.art.childScale(ch)*1.35*R.factor(ch),e=sb.e||0;
    let arms;
    if(sb.celebrate||sb.rope||sb.rest){arms={};for(const [side,dir] of [['left',-1],['right',1]])arms[side]={shoulderX:dir*56,shoulderY:-48,elbowX:dir*(sb.celebrate?78:80),elbowY:sb.celebrate?-100:20,gloveX:dir*(sb.celebrate?75:90),gloveY:sb.celebrate?-160:sb.rope?55:35,gloveScale:1,tiltAngle:dir*.12};}
    return R.draw(c,ch,x,y-177*scale,scale,{view:'front',time:T,left:sb.side===-1?e:0,right:sb.side===1?e:0,high:true,arms,bareHands:sb.rope});
  };
  R.player=function(c,ch,s){
    const A=B.art,k=s.inRing?A.ringScale(ch):.7+.14*A.clamp((ch.size-.6)/.4,0,1),scale=k*1.35*R.factor(ch),t=s.t||0,T=s.time||0;
    let x=640,y=(s.inRing?620+(s.backstep||0)+146*k:742+146*k)-177*scale,rotation=0,left=0,right=0,high=!!s.high,arms,feet,kneeBend;
    const wave=t<.3?A.eout(t/.3):t>.75?1-A.ease((t-.75)/.25):1;
    if(s.st==='dodge'){x+=(s.dir||1)*185*k*wave;rotation=(s.dir||1)*.22*wave;y+=18*k*wave;}
    if(s.st==='duck'){y+=125*k*wave;rotation=.12*wave;}
    if(s.st==='hit'){x+=(s.hitSide||1)*18*k*Math.sin(t*Math.PI);rotation=(s.hitSide||1)*.14*Math.sin(t*Math.PI);}
    if(s.st==='down'||s.st==='getup'){const rise=s.st==='getup'?A.lerp(s.rise||0,1,A.ease(A.clamp(t,0,1))):s.rise||0;y+=230*k*(1-rise)*A.eout(Math.min(1,t));rotation=(s.hitSide||1)*.65*(1-rise);}
    if(['punch','upper','charge','special'].includes(s.st)){
      let progress=s.st==='upper'?R.punchEnvelope(A.clamp((t-(s.wind||.3)+.12)/.55,0,1)):s.st==='charge'?.12:R.punchEnvelope(t);
      if(s.st==='special')progress=Math.abs(Math.sin(t*Math.PI*5));high=high||s.st==='upper';if(s.side==='L')left=progress;else right=progress;
      if(s.st!=='charge'&&high){
        // Seules les frappes hautes sautent : main droite vers la gauche, et inversement.
        const dir=s.side==='L'?-1:1;
        y-=progress*26*scale;
        x-=dir*progress*12*scale;
        rotation=-dir*progress*.11;
        const lift=progress*10;
        feet=[-1,1].map(leg=>({x:leg*25-dir*progress*(leg===dir?8:18),y:177-lift-progress*(leg===dir?8:40)}));
        kneeBend=[-1,1].map(leg=>leg===dir?0:dir*progress*18);
      }
    }
    if(s.aside)x-=330*k*A.eout(A.clamp(s.aside,0,1));
    if(s.recoveryDepth)y+=s.recoveryDepth;
    if(s.st==='block'||s.st==='parry'||s.tired||s.targetGlove){arms={};for(const [side,dir] of [['left',-1],['right',1]]){
      let gx=dir*45,gy=-72,ex=dir*71,ey=7;
      // Garde haute : les gants se rejoignent devant le front, les coudes se resserrent.
      if(s.st==='block'){gx=dir*23;gy=-168;ex=dir*55;ey=-35;}
      if(s.st==='parry'&&((s.hand==='A')===(dir<0))){gx=dir*40;gy=s.high?-102:-15;}
      if(s.tired){gx=dir*70;gy=20;ey=28;}
      if(s.targetGlove&&s.targetGlove.side===(dir<0?'L':'R')){const target=s.targetGlove;gx=A.lerp(gx,target.x*k/scale,target.amount);gy=A.lerp(gy,(target.y*k+ (s.inRing?620:742)-y)/scale,target.amount);ex=(dir*56+gx)/2;ey=(-48+gy)/2+25;}
      arms[side]={shoulderX:dir*56,shoulderY:-48,elbowX:ex,elbowY:ey,gloveX:gx,gloveY:gy,gloveScale:1,tiltAngle:dir*.18};
    }}
    const result=R.draw(c,ch,x,y,scale,{view:'back',time:T,left,right,high,rotation,arms,feet,kneeBend,zone:s.zone,headDrop:s.st==='block'?10:0,element:['punch','upper','special'].includes(s.st)?s.element:null,side:s.side,tied:s.tied,tired:s.tired});
    return {...result,x,y:y+177*scale};
  };
  // Poussée de profil : épaules superposées, coudes sous les poignées et pieds sur la piste.
  R.pushProfile=function(c,ch,pose){
    const old=[ctx,boxer,PALETTE];ctx=c;PALETTE={...BASE_PALETTE};
    const x=pose.x,y=pose.y,k=.72*R.factor(ch),step=pose.moving?pose.stride:0;
    const local=p=>({x:(p.x-x)/k,y:(p.y-y)/k});
    const hands=pose.hands.map(local),floor=(pose.ground-y)/k;
    c.save();c.translate(x,y);c.scale(k,k);
    const limb=(a,b,width,forearm=false)=>drawAnatomicalLimb(a.x,a.y,b.x,b.y,width,width*1.08,width*.8,forearm?'forearm':'upperArm',1);
    function leg(far){
      const phase=far?-step:step,hip={x:far?8:-5,y:9},foot={x:(far?20:-48)+phase*24,y:floor-Math.max(0,phase)*10};
      const knee={x:(hip.x+foot.x)/2+18,y:floor*.5};
      limb(hip,knee,13);limb(knee,{x:foot.x,y:foot.y-9},10,true);
      c.fillStyle=far?'#263442':'#34495e';c.beginPath();c.roundRect(foot.x-12,foot.y-17,33,17,5);c.fill();
      c.fillStyle='#a8bdc9';c.fillRect(foot.x-11,foot.y-4,33,4);
    }
    function arm(far){
      const hand=hands[far?1:0],shoulder={x:far?42:29,y:far?-67:-62};
      const elbow={x:shoulder.x+(hand.x-shoulder.x)*.53,y:Math.max(shoulder.y,hand.y)+14};
      limb(shoulder,elbow,12);limb(elbow,hand,10,true);
      c.fillStyle=PALETTE.skinLight;c.beginPath();c.ellipse(hand.x,hand.y,9,11,-.12,0,Math.PI*2);c.fill();
    }
    try{
      leg(true);arm(true);leg(false);
      const shirt=c.createLinearGradient(-20,-60,46,20);shirt.addColorStop(0,B.art.shade(ch.tank,-.2));shirt.addColorStop(1,ch.tank);
      c.fillStyle=shirt;c.beginPath();c.moveTo(-20,4);c.quadraticCurveTo(-8,-38,23,-76);c.lineTo(47,-67);c.quadraticCurveTo(44,-35,20,16);c.closePath();c.fill();
      c.strokeStyle=B.art.shade(ch.tank,-.2);c.lineWidth=2;c.beginPath();c.moveTo(1,-22);c.quadraticCurveTo(12,-16,23,-18);c.stroke();
      c.fillStyle='#263340';c.beginPath();c.moveTo(-21,2);c.lineTo(22,13);c.lineTo(17,38);c.lineTo(-30,28);c.closePath();c.fill();
      c.strokeStyle=ch.gloves;c.lineWidth=4;c.beginPath();c.moveTo(-20,7);c.lineTo(-27,26);c.stroke();
      limb({x:35,y:-72},{x:45,y:-91},10);
      const img=root.FamilyHeads?.frame(ch.id,'side');if(img){const h=104,w=h*img.width/img.height;c.drawImage(img,49-w/2,-110-h/2,w,h);}
      arm(false);
    }finally{c.restore();[ctx,boxer,PALETTE]=old;}
  };
  R.equipment=function(c,ch,x,y,scale,pose={}){
    scale*=R.factor(ch);const angle=pose.rotation||0,co=Math.cos(angle),si=Math.sin(angle);
    const local=p=>({x:((p.x-x)*co+(p.y-y)*si)/scale,y:((p.y-y)*co-(p.x-x)*si)/scale});
    let arms;
    if(pose.hands){arms={};pose.hands.forEach((hand,i)=>{const dir=i?1:-1,h=local(hand),dx=h.x-dir*56,dy=h.y+48,d=Math.max(.001,Math.hypot(dx,dy)),bend=Math.sqrt(Math.max(0,65*65-d*d/4)),e=pose.elbows?local(pose.elbows[i]):{x:(dir*56+h.x)/2+dy/d*bend*dir,y:(-48+h.y)/2-dx/d*bend*dir};arms[i?'right':'left']={shoulderX:dir*56,shoulderY:-48,elbowX:e.x,elbowY:e.y,gloveX:h.x,gloveY:h.y-18,gloveScale:1,tiltAngle:0};});}
    return R.draw(c,ch,x,y,scale,{...pose,arms,bareHands:true,feet:pose.feet?.map(local)});
  };
  // Même peau et même modelé pour les poses particulières (outils, panier, course).
  R.limb=function(c,ch,a,b,width,forearm=false){const old=[ctx,PALETTE];ctx=c;PALETTE={...BASE_PALETTE};c.save();try{drawAnatomicalLimb(a.x,a.y,b.x,b.y,width*.48,width*.52,width*.4,forearm?'forearm':'upperArm',a.x>b.x?-1:1);}finally{c.restore();[ctx,PALETTE]=old;}};
})(window);
