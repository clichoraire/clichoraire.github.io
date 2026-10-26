// Dessin procédural des personnages en tenue de ballon chasseur (vue 3/4 façon NES), de la balle et des logos.
// Les têtes viennent des portraits de famille (FamilyHeads) partagés avec Hockey Slapshot et Snow Kids.
(function (BC) {
  'use strict';
  const S = BC.sprites = {};
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.closePath(); }
  S.rr = rr; S.circle = circle;
  const shade = (hex, k) => {   // assombrit (k<1) ou éclaircit (k>1) une couleur #rrggbb
    const n = parseInt(hex.slice(1), 16); const f = c => Math.max(0, Math.min(255, Math.round(c * k)));
    return '#' + [f(n >> 16), f(n >> 8 & 255), f(n & 255)].map(c => c.toString(16).padStart(2, '0')).join('');
  };
  S.shade = shade;

  // Ballon de caoutchouc rouge : coutures fines et reflet doux, sans anneau flottant.
  S.drawBall = function (ctx, x, y, r, o) {
    o = o || {};
    ctx.save(); ctx.translate(x, y);
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 18; }
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
    g.addColorStop(0, o.color2 || '#ff8d7a'); g.addColorStop(1, o.color || '#c8281e');
    ctx.fillStyle = g; circle(ctx, 0, 0, r); ctx.fill();
    ctx.shadowBlur = 0;
    // Coutures discrètes sur le caoutchouc, découpées dans la sphère.
    ctx.save(); circle(ctx, 0, 0, r * 0.98); ctx.clip(); ctx.rotate(o.spin || 0);
    ctx.strokeStyle = 'rgba(95,15,18,0.35)'; ctx.lineWidth = Math.max(0.65, r * 0.045);
    for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(-r, side * r * 0.55);
      ctx.bezierCurveTo(-r * 0.35, side * r * 0.15, r * 0.35, side * r * 0.15, r, side * r * 0.55); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(-r * 0.25, -r); ctx.bezierCurveTo(r * 0.25, -r * 0.35, r * 0.25, r * 0.35, -r * 0.25, r); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.23)'; ctx.beginPath(); ctx.ellipse(-r * 0.33, -r * 0.4, r * 0.22, r * 0.12, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(100,18,22,0.6)'; ctx.lineWidth = Math.max(0.7, r * 0.045); circle(ctx, 0, 0, r); ctx.stroke();
    ctx.restore();
  };

  // Personnage debout, pieds en (x, y) (le saut est géré par l'appelant via translate).
  // o : {dir, frame, moving, dash, pose: 'idle'|'windup'|'throw'|'catch'|'hit'|'down'|'jump'|'angel'|'pickup'|'wave', ball, scale, face, alpha}
  S.drawPerson = function (ctx, x, y, d, team, o) {
    if (d.monster) return S.drawMonster(ctx, x, y, d, team, o);
    o = o || {};
    const look = d.look, s = d.size * (o.scale || 1), dir = o.dir || 1, pose = o.pose || 'idle';
    const legH = 14 * s, bodyH = 20 * s, bodyW = (look.belly ? 30 : look.broad ? 28 : look.tall ? 20 : 23) * s;
    const headR = 10 * s * (1 + Math.max(0, 1 - d.size) * 0.9);
    const H = legH + bodyH + headR * 2;
    const color = team.color, color2 = team.color2, shorts = team.dark || '#222';
    ctx.save(); ctx.translate(x, y);
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    if (pose === 'down') { ctx.translate(0, -4 * s); ctx.rotate(dir * Math.PI / 2); ctx.translate(0, H / 2); }
    if (pose === 'hit') { ctx.rotate(-dir * 0.35); }
    if (pose === 'windup') ctx.rotate(-dir * 0.055);
    if (pose === 'throw') ctx.rotate(dir * 0.08);
    ctx.scale(dir, 1);
    const f = o.frame || 0, mv = o.moving ? 1 : 0, run = o.dash ? 1.6 : 1;
    const sw = Math.sin(f) * 5 * s * mv * run;
    const by = -legH - bodyH;            // haut du chandail
    const hy = by - headR * 0.95;        // centre de la tête
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const skin = look.skin;

    // --- ailes et auréole (ange) ---
    if (pose === 'angel') {
      const flap = Math.sin((o.t || 0) * 9) * 0.25;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      for (const k of [-1, 1]) {
        ctx.save(); ctx.translate(k * bodyW / 2, by + 4 * s); ctx.rotate(k * (0.35 + flap)); ctx.scale(k, 1);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(26 * s, -22 * s, 34 * s, -2 * s); ctx.quadraticCurveTo(28 * s, 6 * s, 16 * s, 8 * s); ctx.quadraticCurveTo(26 * s, 14 * s, 10 * s, 16 * s); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 2.5 * s; ctx.beginPath(); ctx.ellipse(0, hy - headR * 1.55, headR * 0.9, headR * 0.28, 0, 0, Math.PI * 2); ctx.stroke();
    }

    // --- bras arrière ---
    const armL = bodyH * 0.72;
    // La main suit l'avant-bras ; le miroir anatomique place le pouce
    // vers le corps au repos et du bon côté quand la paume se lève.
    const mitten = (x, y, angle, side, holding = false) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(-side * s, s);
      // Le poignet se fond dans le bras : aucune bordure de manchette.
      ctx.beginPath(); ctx.moveTo(-2.15, -2.3);
      ctx.bezierCurveTo(-2.3, -0.5, -3.05, 0.2, -3.05, 1.8);
      ctx.bezierCurveTo(-3.05, 4.1, -1.8, 5.0, 0.1, 5.0);
      ctx.bezierCurveTo(2.3, 5.0, 3.1, 3.7, 3.0, 2.0);
      ctx.bezierCurveTo(4.0, 1.7, 4.65, 0.65, 4.2, -0.1);
      ctx.bezierCurveTo(3.7, -0.9, 2.8, -0.2, 2.35, 0.45);
      ctx.quadraticCurveTo(2.05, -0.8, 2.15, -2.3); ctx.closePath();
      ctx.fillStyle = skin; ctx.fill();
      // Un seul pli léger à la base du pouce, jamais un cercle au poignet.
      ctx.strokeStyle = shade(skin, 0.85); ctx.lineWidth = 0.35;
      ctx.beginPath(); ctx.moveTo(2.35, 0.5); ctx.quadraticCurveTo(1.7, 1.1, 1.95, holding ? 2.2 : 1.7); ctx.stroke();
      ctx.restore();
    };
    // Épaule, coude et poignet : deux os de longueur fixe pour chaque pose.
    const drawArm = (side, ang, len, rear = false) => {
      const ax = side * (bodyW / 2 - 0.25 * s), ay = by + 3.5 * s;
      let upper = ang + side * 0.12, lower = ang - side * 0.18;
      if (pose === 'idle' || (pose === 'wave' && rear)) { upper = side * -0.18 + Math.sin(f) * 0.5 * mv * run; lower = upper + side * 0.10; }
      if (pose === 'windup') { upper = rear ? 0.65 : -1.75; lower = rear ? -0.45 : -2.95 + Math.sin((o.t || 0) * 12) * 0.04; }
      if (pose === 'throw') { upper = rear ? 0.4 : -1.65; lower = rear ? -1.05 : -1.8; }
      if (pose === 'wave' && !rear) { upper = -1.25; lower = -3.0 + Math.sin((o.t || 0) * 7) * 0.18; }
      if (pose === 'catch') { upper = rear ? -0.65 : -1.05; lower = -1.7; }
      if (pose === 'pickup') { upper = rear ? -0.3 : -0.55; lower = rear ? -0.9 : -0.1; }
      const u = len * 0.54, l = len * 0.54;
      const ex = ax - Math.sin(upper) * u, ey = ay + Math.cos(upper) * u;
      const hx = ex - Math.sin(lower) * l, hy = ey + Math.cos(lower) * l;
      ctx.strokeStyle = shade(skin, rear ? 0.84 : 0.9); ctx.lineWidth = 5.3 * s;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.strokeStyle = rear ? shade(skin, 0.96) : skin; ctx.lineWidth = 4.4 * s; ctx.stroke();
      mitten(hx, hy, lower, side, o.ball && !rear);
      return { x: hx, y: hy, angle: lower };
    };
    const armBack = (ang, len) => drawArm(-1, ang, len, true);
    let backArmAng = 0.18 + Math.sin(f) * 0.5 * mv * run;
    if (pose === 'windup') backArmAng = -0.4; else if (pose === 'throw') backArmAng = 1.0; else if (pose === 'catch') backArmAng = -1.3;
    else if (pose === 'hit') backArmAng = -2.2; else if (pose === 'jump') backArmAng = -2.6; else if (pose === 'pickup') backArmAng = 1.4; else if (pose === 'angel') backArmAng = -0.2;
    const backInFront = ['idle', 'wave', 'throw', 'catch'].includes(pose);
    if (!backInFront) armBack(backArmAng, armL);

    // --- jambes et espadrilles ---
    for (const k of [-1, 1]) {
      const stance = pose === 'windup' || pose === 'throw' ? 1.22 : 1;
      const lx = k * 5.5 * s * stance, dy = k * sw * 0.6;
      let ly = -legH + dy, lh = legH - 3 * s;
      if (pose === 'jump') { ly = -legH - 2 * s + k * 3 * s; lh = legH - 6 * s; }
      // cuisse (peau) puis short court
      ctx.fillStyle = skin; rr(ctx, lx - 3.4 * s, ly, 6.8 * s, lh, 2.5 * s); ctx.fill();
      ctx.fillStyle = shorts; rr(ctx, lx - 4 * s, -legH - 1 * s, 8 * s, 7 * s + Math.abs(dy) * 0.3, 2.5 * s); ctx.fill();
      // espadrille blanche à semelle
      const fy = (pose === 'jump' ? -5 * s : 0) + (pose === 'jump' ? k * 2 * s : 0);
      ctx.fillStyle = '#f4f4f4'; rr(ctx, lx - 5 * s + dy, fy - 4.5 * s, 11 * s, 4.8 * s, 2 * s); ctx.fill();
      ctx.fillStyle = team.color; ctx.fillRect(lx - 2 * s + dy, fy - 4 * s, 4 * s, 1.6 * s);
      ctx.fillStyle = '#777'; ctx.fillRect(lx - 5 * s + dy, fy - 1.2, 11 * s, 1.4);
    }

    // --- chandail (débardeur de sport) ---
    ctx.fillStyle = color; rr(ctx, -bodyW / 2, by, bodyW, bodyH + 2 * s, 5 * s); ctx.fill();
    if (team.stripe) { ctx.fillStyle = color2; ctx.fillRect(-bodyW / 2, by + bodyH * 0.58, bodyW, 7 * s); ctx.fillStyle = team.stripe; ctx.fillRect(-bodyW / 2, by + bodyH * 0.58 + 1.5 * s, bodyW, 4 * s); }
    else { ctx.fillStyle = color2; ctx.fillRect(-bodyW / 2, by + bodyH * 0.68, bodyW, 3 * s); }
    ctx.fillStyle = shade(color, 0.75); rr(ctx, -bodyW * 0.22, by - 1, bodyW * 0.44, 3 * s, 1.5 * s); ctx.fill();
    const num = o.number != null ? o.number : (d.number != null ? d.number : d.age);
    ctx.save(); ctx.scale(dir, 1);
    ctx.fillStyle = color2; ctx.font = `bold ${Math.max(7, Math.round(8.5 * s))}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(num), 0, by + bodyH * 0.38);
    ctx.restore();

    // --- bras avant ---
    const armFront = (ang, len) => drawArm(1, ang, len);
    const t = o.t || 0;
    let frontAng = -0.18 - Math.sin(f) * 0.5 * mv * run;
    if (pose === 'windup') frontAng = -2.25 + Math.sin(t * 20) * 0.08; else if (pose === 'throw') frontAng = -1.55; else if (pose === 'catch') frontAng = -1.35;
    else if (pose === 'hit') frontAng = -2.6; else if (pose === 'jump') frontAng = -2.5; else if (pose === 'pickup') frontAng = -0.3; else if (pose === 'wave') frontAng = Math.PI + 0.55 + Math.sin(t * 7) * 0.35; else if (pose === 'angel') frontAng = -0.2;
    if (backInFront) armBack(backArmAng, armL);
    const hand = armFront(frontAng, armL * 0.95);
    // --- balle dans les mains ---
    if (o.ball) {
      const br = BC.BALL_R * Math.max(0.8, s);
      // Le ballon repose dans la main, à côté du visage.
      const released = pose === 'throw';
      const bx = hand.x + br * (released ? 2.2 : 0.72), byy = hand.y - br * (released ? 0.35 : 0.68);
      ctx.save(); ctx.scale(dir, 1); S.drawBall(ctx, bx * dir, byy, br, {}); ctx.restore();
      mitten(hand.x, hand.y, hand.angle, 1, true);
    }

    // --- tête : portrait de famille, sinon visage procédural ---
    const view = o.face || (o.dash || (o.moving && pose === 'idle') ? 'side' : 'front');
    if (window.FamilyHeads && window.FamilyHeads.has(d.familyPortrait)) {
      ctx.save();
      if (pose === 'hit') ctx.translate(0, 1.5 * s);
      window.FamilyHeads.draw(ctx, d.familyPortrait, view, -headR * 1.22, hy - headR * 1.35, headR * 2.44, headR * 2.4);
      ctx.restore();
      if (pose === 'hit' || pose === 'down') {   // petites étoiles d'étourdissement
        ctx.fillStyle = '#ffe36b'; for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; circle(ctx, Math.cos(a) * headR * 1.3, hy - headR * 1.5 + Math.sin(a) * headR * 0.3, 2.2 * s); ctx.fill(); }
      }
    } else {
      const hair = look.hair || '#333';
      if (look.hairStyle === 'long') { ctx.fillStyle = hair; rr(ctx, -headR * 1.15, hy - headR * 0.3, headR * 2.3, headR * 1.9, headR * 0.5); ctx.fill(); }
      if (look.hairStyle === 'ponytail') { ctx.fillStyle = hair; ctx.beginPath(); ctx.ellipse(-headR * 1.05, hy + headR * 0.35, headR * 0.32, headR * 0.95, 0.25, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = skin; circle(ctx, -headR * 0.95, hy + headR * 0.05, headR * 0.24); ctx.fill(); circle(ctx, headR * 0.95, hy + headR * 0.05, headR * 0.24); ctx.fill();
      if (look.earrings) { ctx.fillStyle = '#ffd700'; circle(ctx, -headR * 0.97, hy + headR * 0.34, headR * 0.1); ctx.fill(); circle(ctx, headR * 0.97, hy + headR * 0.34, headR * 0.1); ctx.fill(); }
      circle(ctx, 0, hy, headR); ctx.fillStyle = skin; ctx.fill(); ctx.strokeStyle = shade(skin, 0.8); ctx.lineWidth = 1; ctx.stroke();
      S.drawFace(ctx, d, hy, headR, { down: pose === 'hit' || pose === 'down', scream: pose === 'hit', smile: pose === 'wave' || pose === 'angel' });
    }
    ctx.restore();
  };

  S.drawFace = function (ctx, d, hy, R, o) {
    const look = d.look, hair = look.hair || '#333', kid = d.size < 0.8;
    const ex = R * 0.12;   // les yeux regardent vers l'avant (vue 3/4)
    // cheveux
    ctx.fillStyle = hair;
    switch (look.hairStyle) {
      case 'short': ctx.beginPath(); ctx.arc(0, hy - R * 0.08, R * 1.06, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill(); ctx.fillRect(-R * 1.05, hy - R * 0.1, R * 0.3, R * 0.5); break;
      case 'buzz': ctx.beginPath(); ctx.arc(0, hy - R * 0.05, R * 1.02, Math.PI + 0.15, Math.PI * 2 - 0.15); ctx.closePath(); ctx.fill(); break;
      case 'bald':
        ctx.beginPath(); ctx.arc(-R * 0.75, hy + R * 0.05, R * 0.42, Math.PI * 0.9, Math.PI * 2.1); ctx.fill();
        ctx.beginPath(); ctx.arc(R * 0.78, hy + R * 0.05, R * 0.34, Math.PI * 0.9, Math.PI * 2.1); ctx.fill();
        ctx.strokeStyle = hair; ctx.lineWidth = 1; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * R * 0.2, hy - R); ctx.lineTo(i * R * 0.2 + R * 0.15, hy - R * 1.3); ctx.stroke(); }
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; circle(ctx, R * 0.2, hy - R * 0.6, R * 0.22); ctx.fill(); break;
      case 'bun':
        ctx.beginPath(); ctx.arc(0, hy - R * 0.05, R * 1.06, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill();
        circle(ctx, -R * 0.35, hy - R * 1.12, R * 0.45); ctx.fill(); ctx.fillStyle = shade(hair, 0.8); circle(ctx, -R * 0.35, hy - R * 1.12, R * 0.2); ctx.fill(); break;
      case 'long': ctx.beginPath(); ctx.arc(0, hy - R * 0.05, R * 1.1, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill(); break;
      case 'ponytail': ctx.beginPath(); ctx.arc(0, hy - R * 0.05, R * 1.06, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = shade(hair, 0.8); ctx.fillRect(-R * 1.05, hy - R * 0.35, R * 0.28, R * 0.55); break;
      case 'curly': for (let i = -3; i <= 3; i++) { circle(ctx, i * R * 0.33, hy - R * 0.85 - (3 - Math.abs(i)) * R * 0.12, R * 0.34); ctx.fill(); } circle(ctx, -R * 1.0, hy - R * 0.4, R * 0.32); ctx.fill(); circle(ctx, R * 1.0, hy - R * 0.4, R * 0.32); ctx.fill(); break;
      case 'spiky': ctx.beginPath(); ctx.arc(0, hy - R * 0.05, R * 1.04, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill();
        for (let i = -2; i <= 2; i++) { const bx = i * R * 0.42; ctx.beginPath(); ctx.moveTo(bx - R * 0.25, hy - R * 0.85); ctx.lineTo(bx + R * 0.1, hy - R * 1.55); ctx.lineTo(bx + R * 0.35, hy - R * 0.8); ctx.closePath(); ctx.fill(); } break;
      case 'tuque': ctx.beginPath(); ctx.arc(0, hy - R * 0.1, R * 1.08, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = look.hat || '#c33'; ctx.beginPath(); ctx.arc(0, hy - R * 0.25, R * 1.12, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff'; rr(ctx, -R * 1.12, hy - R * 0.45, R * 2.24, R * 0.34, R * 0.1); ctx.fill(); circle(ctx, 0, hy - R * 1.4, R * 0.3); ctx.fill(); break;
      case 'cap': ctx.beginPath(); ctx.arc(0, hy - R * 0.05, R * 1.04, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = look.hat || '#222'; ctx.beginPath(); ctx.arc(0, hy - R * 0.2, R * 1.1, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill();
        rr(ctx, -R * 0.2, hy - R * 0.45, R * 1.75, R * 0.3, R * 0.1); ctx.fill(); break;
      case 'fringe': ctx.beginPath(); ctx.arc(0, hy - R * 0.05, R * 1.08, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-R * 0.2, hy - R * 0.9); ctx.lineTo(R * 1.05, hy - R * 0.6); ctx.lineTo(R * 0.95, hy + R * 0.1); ctx.lineTo(R * 0.3, hy - R * 0.2); ctx.closePath(); ctx.fill(); break;
      case 'wavy': ctx.beginPath(); ctx.arc(0, hy - R * 0.05, R * 1.08, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill();
        for (let i = -2; i <= 2; i++) { circle(ctx, i * R * 0.42, hy - R * 0.95, R * 0.3); ctx.fill(); } ctx.fillRect(-R * 1.08, hy - R * 0.2, R * 0.3, R * 0.7); break;
      case 'slick': ctx.beginPath(); ctx.arc(0, hy - R * 0.1, R * 1.05, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill();
        ctx.fillRect(-R * 1.05, hy - R * 0.2, R * 0.35, R * 0.6); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, hy - R * 0.1, R * 0.85, Math.PI * 1.25, Math.PI * 1.75); ctx.stroke(); break;
      case 'wild': for (let i = 0; i < 9; i++) { const a = Math.PI + i * Math.PI / 8, len = R * (1.35 + (i % 2) * 0.35); ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.18) * R, hy + Math.sin(a - 0.18) * R); ctx.lineTo(Math.cos(a) * len, hy + Math.sin(a) * len); ctx.lineTo(Math.cos(a + 0.18) * R, hy + Math.sin(a + 0.18) * R); ctx.closePath(); ctx.fill(); }
        ctx.beginPath(); ctx.arc(0, hy - R * 0.05, R * 1.05, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill(); ctx.fillRect(-R * 1.05, hy - R * 0.1, R * 0.4, R * 1.1); break;
      case 'toupee': ctx.fillStyle = '#2a1a0a'; rr(ctx, -R * 1.0, hy - R * 1.25, R * 1.9, R * 0.75, R * 0.35); ctx.fill();
        ctx.strokeStyle = look.skin; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-R * 0.95, hy - R * 0.55); ctx.lineTo(R * 0.85, hy - R * 0.6); ctx.stroke(); break;
      case 'swept':   // mèche de côté sur le front
        ctx.beginPath(); ctx.arc(0, hy - R * 0.05, R * 1.08, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-R * 1.05, hy - R * 0.5); ctx.quadraticCurveTo(R * 0.2, hy - R * 0.2, R * 1.02, hy - R * 0.55); ctx.lineTo(R * 1.05, hy - R * 0.9); ctx.lineTo(-R * 1.05, hy - R * 0.9); ctx.closePath(); ctx.fill();
        ctx.fillRect(-R * 1.08, hy - R * 0.3, R * 0.3, R * 0.75); break;
      case 'quiff':   // banane relevée, côtés courts
        ctx.beginPath(); ctx.arc(0, hy - R * 0.1, R * 1.02, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-R * 0.9, hy - R * 0.8); ctx.quadraticCurveTo(-R * 0.3, hy - R * 1.75, R * 0.6, hy - R * 1.6); ctx.quadraticCurveTo(R * 1.1, hy - R * 1.45, R * 1.0, hy - R * 0.7); ctx.closePath(); ctx.fill();
        ctx.fillStyle = shade(hair, 0.8); ctx.fillRect(-R * 1.05, hy - R * 0.4, R * 0.25, R * 0.6); ctx.fillStyle = hair; break;
      case 'mullet': ctx.beginPath(); ctx.arc(0, hy - R * 0.05, R * 1.06, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill();
        rr(ctx, -R * 1.2, hy - R * 0.3, R * 0.7, R * 1.7, R * 0.25); ctx.fill(); break;
      case 'none': break;
    }
    if (look.bandana) { ctx.fillStyle = look.bandana; rr(ctx, -R * 1.08, hy - R * 0.75, R * 2.16, R * 0.38, R * 0.1); ctx.fill(); ctx.beginPath(); ctx.moveTo(-R * 1.0, hy - R * 0.6); ctx.lineTo(-R * 1.6, hy - R * 0.2); ctx.lineTo(-R * 1.1, hy - R * 0.35); ctx.closePath(); ctx.fill(); }
    if (look.sweat) { ctx.fillStyle = '#5ec8ff'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(R * 1.25 + i * R * 0.15, hy - R * 0.5 + i * R * 0.45, R * 0.1, R * 0.17, 0, 0, Math.PI * 2); ctx.fill(); } }
    if (look.earbuds) { ctx.strokeStyle = '#eee'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-R * 0.95, hy + R * 0.1); ctx.lineTo(-R * 1.0, hy + R * 1.6); ctx.stroke(); ctx.fillStyle = '#eee'; circle(ctx, -R * 0.95, hy + R * 0.08, R * 0.12); ctx.fill(); }
    // joues, taches de rousseur, rides
    if (look.cheeks) { ctx.fillStyle = 'rgba(255,120,130,0.45)'; circle(ctx, -R * 0.45 + ex, hy + R * 0.3, R * 0.2); ctx.fill(); circle(ctx, R * 0.55 + ex, hy + R * 0.3, R * 0.2); ctx.fill(); }
    if (look.freckles) { ctx.fillStyle = 'rgba(150,90,50,0.6)'; for (let i = 0; i < 5; i++) { circle(ctx, (i - 2) * R * 0.22 + ex, hy + R * 0.28 + (i % 2) * R * 0.1, R * 0.05); ctx.fill(); } }
    if (look.wrinkles) { ctx.strokeStyle = shade(look.skin, 0.72); ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(-R * 0.3, hy - R * 0.6); ctx.lineTo(R * 0.3, hy - R * 0.6); ctx.moveTo(-R * 0.2, hy - R * 0.45); ctx.lineTo(R * 0.2, hy - R * 0.45); ctx.stroke();
      for (const k of [-1, 1]) { const cx = k * R * 0.72 + ex; ctx.beginPath(); ctx.moveTo(cx, hy - R * 0.05); ctx.lineTo(cx + k * R * 0.18, hy - R * 0.15); ctx.moveTo(cx, hy + R * 0.02); ctx.lineTo(cx + k * R * 0.18, hy + R * 0.12); ctx.stroke(); } }
    // yeux
    const eyeY = hy - R * 0.08, er = R * (kid ? 0.16 : 0.12);
    const exs = [-R * 0.38 + ex, R * 0.42 + ex];
    if (o.stunKind === 'dizzy' || o.down) { ctx.strokeStyle = '#222'; ctx.lineWidth = 1.2; for (const x of exs) { ctx.beginPath(); ctx.moveTo(x - er, eyeY - er); ctx.lineTo(x + er, eyeY + er); ctx.moveTo(x + er, eyeY - er); ctx.lineTo(x - er, eyeY + er); ctx.stroke(); } }
    else if (look.squint) { ctx.strokeStyle = '#222'; ctx.lineWidth = R * 0.13; ctx.lineCap = 'round'; for (const x of exs) { ctx.beginPath(); ctx.arc(x, eyeY + er * 1.3, er * 1.1, Math.PI + 0.35, Math.PI * 2 - 0.35); ctx.stroke(); } }
    else {
      if (kid || look.crazyEyes) { ctx.fillStyle = '#fff'; for (const x of exs) { circle(ctx, x, eyeY, er * (look.crazyEyes ? 2 : 1.5)); ctx.fill(); } }
      if (look.eyes) { ctx.fillStyle = look.eyes; for (const x of exs) { circle(ctx, x, eyeY, er * 1.25); ctx.fill(); } }
      ctx.fillStyle = '#222'; for (const x of exs) { circle(ctx, x + (kid ? er * 0.3 : 0) + (look.crazyEyes ? er * 0.6 : 0), eyeY - (look.crazyEyes ? er * 0.4 : 0), er * (look.crazyEyes ? 0.8 : 1)); ctx.fill(); }
      if (!kid) { ctx.fillStyle = '#fff'; for (const x of exs) { circle(ctx, x + er * 0.35, eyeY - er * 0.35, er * 0.35); ctx.fill(); } }
    }
    // sourcils
    ctx.strokeStyle = look.eyebrows === 'bushy' ? (look.hair || '#333') : shade(look.hair || '#333', 0.9); ctx.lineWidth = look.eyebrows === 'bushy' ? R * 0.22 : R * 0.09;
    const browY = eyeY - er - R * 0.18 - (o.scream ? R * 0.1 : 0);
    for (const x of exs) { ctx.beginPath(); ctx.moveTo(x - R * 0.2, browY + (look.eyebrows === 'bushy' ? R * 0.05 : 0)); ctx.lineTo(x + R * 0.2, browY); ctx.stroke(); }
    // lunettes
    if (look.glasses) {
      const gy = look.glasses === 'reading' ? eyeY + R * 0.18 : eyeY, gr = look.glasses === 'reading' ? R * 0.3 : R * 0.36;
      ctx.strokeStyle = look.glasses === 'reading' ? '#8a6d3b' : '#1a1a1a'; ctx.lineWidth = 1.3;
      for (const x of exs) { ctx.beginPath(); if (look.glasses === 'reading') ctx.arc(x, gy, gr, 0, Math.PI); else ctx.arc(x, gy, gr, 0, Math.PI * 2); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(exs[0] + gr, gy); ctx.lineTo(exs[1] - gr, gy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(exs[0] - gr, gy); ctx.lineTo(-R * 0.95, gy - R * 0.08); ctx.stroke();
      if (look.glasses !== 'reading') { ctx.fillStyle = 'rgba(180,220,255,0.3)'; for (const x of exs) { circle(ctx, x, gy, gr); ctx.fill(); } }
    }
    if (look.sunglasses) { ctx.fillStyle = '#111'; for (const x of exs) { rr(ctx, x - R * 0.36, eyeY - R * 0.24, R * 0.72, R * 0.42, R * 0.12); ctx.fill(); } ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(exs[0] + R * 0.36, eyeY - R * 0.1); ctx.lineTo(exs[1] - R * 0.36, eyeY - R * 0.1); ctx.moveTo(exs[0] - R * 0.36, eyeY - R * 0.1); ctx.lineTo(-R * 0.95, eyeY - R * 0.15); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; for (const x of exs) { rr(ctx, x - R * 0.3, eyeY - R * 0.2, R * 0.25, R * 0.12, R * 0.05); ctx.fill(); } }
    // nez
    ctx.strokeStyle = shade(look.skin, 0.75); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(R * 0.1 + ex, hy); ctx.lineTo(R * 0.22 + ex, hy + R * 0.28); ctx.stroke();
    // barbe, bouc
    if (look.beard) { ctx.fillStyle = look.beard; ctx.beginPath(); ctx.arc(0, hy, R * 0.98, 0.25, Math.PI - 0.25); ctx.closePath(); ctx.fill(); ctx.fillStyle = look.skin; circle(ctx, R * 0.05 + ex, hy + R * 0.42, R * (look.grin ? 0.4 : 0.26)); ctx.fill(); ctx.fillStyle = look.beard; ctx.beginPath(); ctx.ellipse(R * 0.1 + ex, hy + R * 0.3, R * 0.42, R * 0.1, 0, 0, Math.PI * 2); ctx.fill(); }
    if (look.goatee) { ctx.fillStyle = look.goatee; rr(ctx, -R * 0.2 + ex, hy + R * 0.55, R * 0.5, R * 0.45, R * 0.15); ctx.fill(); }
    if (look.stubble) { ctx.fillStyle = 'rgba(40,30,20,0.18)'; ctx.beginPath(); ctx.arc(0, hy, R * 0.97, 0.35, Math.PI - 0.35); ctx.closePath(); ctx.fill(); }
    // bouche
    const my = hy + R * 0.5;
    if (look.pacifier) { ctx.fillStyle = '#5ec8ff'; circle(ctx, R * 0.12 + ex, my, R * 0.3); ctx.fill(); ctx.fillStyle = '#fff'; circle(ctx, R * 0.12 + ex, my, R * 0.12); ctx.fill(); }
    else if (o.stunKind === 'eat' || o.scream) { ctx.fillStyle = o.scream ? '#5a1a1a' : '#6b2a2a'; ctx.beginPath(); ctx.ellipse(R * 0.12 + ex, my, R * (o.scream ? 0.3 : 0.2), R * (o.scream ? 0.4 : 0.25), 0, 0, Math.PI * 2); ctx.fill(); if (o.stunKind === 'eat') { ctx.fillStyle = '#c98b4a'; circle(ctx, R * 0.5 + ex, my + R * 0.1, R * 0.28); ctx.fill(); ctx.fillStyle = '#5a3a1a'; circle(ctx, R * 0.45 + ex, my + R * 0.05, R * 0.06); ctx.fill(); circle(ctx, R * 0.6 + ex, my + R * 0.18, R * 0.06); ctx.fill(); } }
    else if (o.smile || look.grin) { ctx.fillStyle = '#5a1a1a'; ctx.beginPath(); ctx.arc(R * 0.1 + ex, my - R * 0.15, R * 0.42, 0.15, Math.PI - 0.15); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(R * 0.1 + ex - R * 0.3, my - R * 0.15, R * 0.6, R * 0.12); if (look.lipstick) { ctx.strokeStyle = '#d6264a'; ctx.lineWidth = R * 0.1; ctx.beginPath(); ctx.arc(R * 0.1 + ex, my - R * 0.15, R * 0.42, 0.15, Math.PI - 0.15); ctx.stroke(); } }
    else if (look.lipstick) { ctx.strokeStyle = '#d6264a'; ctx.lineWidth = R * 0.14; ctx.beginPath(); ctx.arc(R * 0.1 + ex, my - R * 0.1, R * 0.3, 0.2, Math.PI - 0.2); ctx.stroke(); }
    else { ctx.strokeStyle = shade(look.skin, 0.6); ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(R * 0.1 + ex, my - R * 0.15, R * 0.3, 0.3, Math.PI - 0.3); ctx.stroke(); }
    if (look.mustache) { ctx.fillStyle = look.mustache; ctx.beginPath(); ctx.ellipse(R * 0.1 + ex, hy + R * 0.33, R * 0.45, R * 0.13, 0, 0, Math.PI * 2); ctx.fill(); }
    if (look.cigarette) {
      ctx.strokeStyle = '#f4f4f4'; ctx.lineWidth = R * 0.14; ctx.beginPath(); ctx.moveTo(R * 0.35 + ex, my); ctx.lineTo(R * 1.25 + ex, my + R * 0.15); ctx.stroke();
      ctx.fillStyle = '#ff5a1f'; circle(ctx, R * 1.27 + ex, my + R * 0.15, R * 0.09); ctx.fill();
      const t = (typeof performance !== 'undefined' ? performance.now() : 0) / 600;
      ctx.fillStyle = 'rgba(200,200,200,0.55)'; for (let i = 0; i < 3; i++) { const ph = (t + i * 0.33) % 1; circle(ctx, R * 1.3 + ex + Math.sin(ph * 6) * R * 0.15, my - ph * R * 1.4, R * (0.12 + ph * 0.2)); ctx.fill(); }
    }
  };


  // Logo d'équipe : écusson avec l'initiale (le même que dans Hockey Slapshot).
  S.drawLogo = function (ctx, x, y, team, size) {
    ctx.save(); ctx.translate(x, y);
    const w = size, h = size * 1.1;
    ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, -h / 2); ctx.lineTo(w / 2, h * 0.1); ctx.quadraticCurveTo(w / 2, h * 0.4, 0, h / 2); ctx.quadraticCurveTo(-w / 2, h * 0.4, -w / 2, h * 0.1); ctx.closePath();
    ctx.fillStyle = team.color; ctx.fill(); ctx.lineWidth = size * 0.06; ctx.strokeStyle = team.color2; ctx.stroke();
    ctx.fillStyle = team.color2; ctx.font = `bold ${Math.round(size * 0.55)}px Arial Black, Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(team.initial || team.short[0], 0, -size * 0.02);
    ctx.restore();
  };

  // Buste en gros plan qui salue (fiche au survol). Dessine dans un canevas existant.
  S.drawBust = function (ctx, d, team, w, h) {
    ctx.clearRect(0, 0, w, h);
    const sc = 3.2 / Math.max(0.75, d.size);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
    S.drawPerson(ctx, w / 2 - 6, h + 24 * d.size * sc, d, team, { scale: sc, dir: 1, frame: 0, pose: 'wave', t: performance.now() / 1000 });
    ctx.restore();
  };
  // Portrait (canevas) d'un joueur pour les menus.
  S.portrait = function (d, team, w, h, scale, opts) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d');
    S.drawPerson(ctx, w / 2, h - 6, d, team, Object.assign({ scale, dir: 1, frame: 0 }, opts || {}));
    return c;
  };
  // Visage seul (pour le tableau des points de vie).
  S.drawHead = function (ctx, d, x, y, size) {
    if (d.monster) return S.drawMonsterHead(ctx, d, x, y, size * 0.4);
    if (window.FamilyHeads && window.FamilyHeads.has(d.familyPortrait)) { window.FamilyHeads.draw(ctx, d.familyPortrait, 'front', x - size / 2, y - size / 2, size, size); return; }
    ctx.save(); ctx.translate(x, y); const R = size * 0.4;
    ctx.fillStyle = d.look.skin; circle(ctx, 0, 0, R); ctx.fill(); S.drawFace(ctx, d, 0, R, {}); ctx.restore();
  };
})(window.BC);
