#targetengine "session"

// ─── LICENCE SYSTEM ───────────────────────────────────────────────────────────
var PDFNAV_VERSION    = '1.0';
var PDFNAV_TRIAL_DAYS = 14;
var PDFNAV_LIC_PATH   = Folder.userData.fsName + '/.pdfnavigator.lic';

function _navHash(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = (((h << 5) + h) + s.charCodeAt(i)) | 0;
    return h >>> 0;
}
function _navExpectedKey(email) {
    var e  = (email || '').toLowerCase().replace(/\s/g, '');
    var s1 = (0x4E56 | (0x4150 << 16)) >>> 0;
    var s2 = (0x4446 | (0x314E << 16)) >>> 0;
    var h1 = (_navHash(e + '\x70\x6E\x61\x76\x5F\x61') ^ s1) >>> 0;
    var h2 = (_navHash(e + '\x70\x6E\x61\x76\x5F\x62') ^ s2) >>> 0;
    function x8(n) { return ('0000000' + n.toString(16).toUpperCase()).slice(-8); }
    return 'PDFN-' + x8(h1) + '-' + x8(h2);
}
function _navReadLic() {
    var d = { install: 0, email: '', key: '' };
    var f = new File(PDFNAV_LIC_PATH);
    if (!f.exists) return d;
    try {
        f.open('r');
        while (!f.eof) {
            var ln = f.readln(), kv = ln.split('=');
            if (kv.length < 2) continue;
            var k = kv[0].replace(/\s/g, ''), v = kv.slice(1).join('=');
            if (k === 'install') d.install = parseInt(v, 10) || 0;
            if (k === 'email')   d.email   = v;
            if (k === 'key')     d.key     = v;
        }
        f.close();
    } catch(e) { try { f.close(); } catch(ee) {} }
    return d;
}
function _navWriteLic(d) {
    try {
        var f = new File(PDFNAV_LIC_PATH);
        f.lineFeed = 'Unix'; f.open('w');
        f.writeln('v=1');
        f.writeln('install=' + (d.install || 0));
        f.writeln('email='   + (d.email   || ''));
        f.writeln('key='     + (d.key     || ''));
        f.close(); return true;
    } catch(e) { return false; }
}
function _navNow() { return Math.floor(new Date().getTime() / 1000); }
function _navStatus() {
    var lic = _navReadLic();
    if (!lic.install || lic.install <= 0) { lic.install = _navNow(); _navWriteLic(lic); }
    var licensed = !!(lic.email && lic.key && lic.key === _navExpectedKey(lic.email));
    if (licensed) return { mode: 'pro', daysLeft: 9999, email: lic.email };
    var left = Math.max(0, PDFNAV_TRIAL_DAYS - Math.floor((_navNow() - lic.install) / 86400));
    return { mode: left > 0 ? 'trial' : 'expired', daysLeft: left, email: '' };
}
function _navActivate(email, key) {
    var e = (email || '').toLowerCase().replace(/\s/g, '');
    if (!e || key !== _navExpectedKey(e)) return false;
    var lic = _navReadLic(); lic.email = e; lic.key = key;
    return _navWriteLic(lic);
}
var pdfNavLicStatus = _navStatus();

// ─── FERMER FENETRE EXISTANTE ─────────────────────────────────────────────────
if (typeof pdfWin !== 'undefined' && pdfWin !== null) {
    try { pdfWin.hide(); } catch(e) {}
    pdfWin = null;
}

// ─── DETECTION LOCALE ─────────────────────────────────────────────────────────
if (typeof pdfNavLang === 'undefined') {
    var detectedLocale = '';
    try { detectedLocale = $.locale; } catch(e) {}
    var lp = detectedLocale.length >= 2 ? detectedLocale.toLowerCase().substring(0, 2) : '';
    pdfNavLang = ({fr:'fr', de:'de', es:'es', it:'it'}[lp] || 'en');
}

// ─── TRADUCTIONS ──────────────────────────────────────────────────────────────
var translations = {
    fr: {
        winTitle:      "Navigateur PDF",
        filePanel:     "Fichier source",
        pagePanel:     "Page à afficher",
        offsetPanel:   "Décalage global",
        offsetLabel:   "Décaler toutes les instances du même fichier :",
        applyOffset:   "Appliquer",
        layerPanel:    "Calques",
        previewPanel:  "Aperçu",
        showPreview:   "Afficher l'aperçu",
        totalPages:    "Total des pages :",
        noPreview:     "Cochez « Afficher l'aperçu » pour voir la page.",
        noLayers:      "Aucun calque détecté.",
        noLayersHint:  "(PDF/AI avec calques OCG uniquement)",
        showAll:       "Tout afficher",
        hideAll:       "Tout masquer",
        pages:         "pages",
        close:         "Fermer",
        apply:         "Appliquer",
        refresh:       "↺ Actualiser",
        layer:         "Calque",
        invalidPage:   "Numéro de page invalide.",
        invalidOffset: "Décalage invalide (entier requis).",
        pageOver:      "Ce fichier contient {t} pages.",
        noDoc:         "Aucun document ouvert.",
        noSel:         "Sélectionnez un cadre contenant un fichier placé.",
        noFile:        "Fichier source introuvable sur le disque.",
        undoLabel:     "Changer page",
        undoOffset:    "Décalage global pages",
        previewError:  "Aperçu non disponible.",
        licPanel:      "Licence",
        trialBanner:   "Essai : {n} jour(s) restant(s)",
        expiredBanner: "Essai expiré — fonctions bloquées",
        proBanner:     "Version Pro",
        emailLbl:      "Email d'achat :",
        keyLbl:        "Clé de licence :",
        activateBtn:   "Activer",
        activateOk:    "Licence activée avec succes !",
        activateErr:   "Clé invalide. Veuillez réessayer.",
        buyBtn:        "Acheter une licence →",
        blockedMsg:    "Fonctionnalité réservée à la version Pro.\nActivez votre licence ou achetez sur le site."
    },
    en: {
        winTitle:      "PDF Navigator",
        filePanel:     "Source file",
        pagePanel:     "Page to display",
        offsetPanel:   "Global offset",
        offsetLabel:   "Shift all instances of same file:",
        applyOffset:   "Apply",
        layerPanel:    "Layers",
        previewPanel:  "Preview",
        showPreview:   "Show preview",
        totalPages:    "Total pages:",
        noPreview:     "Check \"Show preview\" to see the page.",
        noLayers:      "No layers detected.",
        noLayersHint:  "(PDF/AI with OCG layers only)",
        showAll:       "Show all",
        hideAll:       "Hide all",
        pages:         "pages",
        close:         "Close",
        apply:         "Apply",
        refresh:       "↺ Refresh",
        layer:         "Layer",
        invalidPage:   "Invalid page number.",
        invalidOffset: "Invalid offset (integer required).",
        pageOver:      "This file has {t} pages.",
        noDoc:         "No document open.",
        noSel:         "Select a frame containing a placed file.",
        noFile:        "Source file not found on disk.",
        undoLabel:     "Change page",
        undoOffset:    "Global page offset",
        previewError:  "Preview not available.",
        licPanel:      "License",
        trialBanner:   "Trial: {n} day(s) remaining",
        expiredBanner: "Trial expired — features locked",
        proBanner:     "Pro version",
        emailLbl:      "Purchase email:",
        keyLbl:        "License key:",
        activateBtn:   "Activate",
        activateOk:    "License activated successfully!",
        activateErr:   "Invalid key. Please try again.",
        buyBtn:        "Buy a license →",
        blockedMsg:    "This feature requires the Pro version.\nActivate your license or purchase on the website."
    },
    de: {
        winTitle:      "PDF-Navigator",
        filePanel:     "Quelldatei",
        pagePanel:     "Anzuzeigende Seite",
        offsetPanel:   "Globaler Versatz",
        offsetLabel:   "Alle Instanzen der gleichen Datei verschieben:",
        applyOffset:   "Anwenden",
        layerPanel:    "Ebenen",
        previewPanel:  "Vorschau",
        showPreview:   "Vorschau anzeigen",
        totalPages:    "Seiten gesamt:",
        noPreview:     "\"Vorschau anzeigen\" aktivieren.",
        noLayers:      "Keine Ebenen erkannt.",
        noLayersHint:  "(Nur PDF/AI mit OCG-Ebenen)",
        showAll:       "Alle anzeigen",
        hideAll:       "Alle ausblenden",
        pages:         "Seiten",
        close:         "Schließen",
        apply:         "Anwenden",
        refresh:       "↺ Aktualisieren",
        layer:         "Ebene",
        invalidPage:   "Ungültige Seitenzahl.",
        invalidOffset: "Ungültiger Versatz (ganze Zahl erforderlich).",
        pageOver:      "Diese Datei hat {t} Seiten.",
        noDoc:         "Kein Dokument geöffnet.",
        noSel:         "Bitte Rahmen mit platzierter Datei wählen.",
        noFile:        "Quelldatei nicht auf dem Laufwerk gefunden.",
        undoLabel:     "Seite ändern",
        undoOffset:    "Globaler Seitenversatz",
        previewError:  "Vorschau nicht verfügbar.",
        licPanel:      "Lizenz",
        trialBanner:   "Testversion: noch {n} Tag(e)",
        expiredBanner: "Testversion abgelaufen — Funktionen gesperrt",
        proBanner:     "Pro-Version",
        emailLbl:      "Kauf-E-Mail:",
        keyLbl:        "Lizenzschlüssel:",
        activateBtn:   "Aktivieren",
        activateOk:    "Lizenz erfolgreich aktiviert!",
        activateErr:   "Ungültiger Schlüssel. Bitte erneut versuchen.",
        buyBtn:        "Lizenz kaufen →",
        blockedMsg:    "Diese Funktion erfordert die Pro-Version.\nLizenz aktivieren oder auf der Website kaufen."
    },
    es: {
        winTitle:      "Navegador PDF",
        filePanel:     "Archivo fuente",
        pagePanel:     "Página a mostrar",
        offsetPanel:   "Desplazamiento global",
        offsetLabel:   "Desplazar todas las instancias del mismo archivo:",
        applyOffset:   "Aplicar",
        layerPanel:    "Capas",
        previewPanel:  "Vista previa",
        showPreview:   "Mostrar vista previa",
        totalPages:    "Total de páginas:",
        noPreview:     "Active \"Mostrar vista previa\".",
        noLayers:      "No se detectaron capas.",
        noLayersHint:  "(Solo PDF/AI con capas OCG)",
        showAll:       "Mostrar todo",
        hideAll:       "Ocultar todo",
        pages:         "páginas",
        close:         "Cerrar",
        apply:         "Aplicar",
        refresh:       "↺ Actualizar",
        layer:         "Capa",
        invalidPage:   "Número de página inválido.",
        invalidOffset: "Desplazamiento inválido (se requiere entero).",
        pageOver:      "Este archivo tiene {t} páginas.",
        noDoc:         "No hay documento abierto.",
        noSel:         "Seleccione un marco con un archivo colocado.",
        noFile:        "Archivo fuente no encontrado en disco.",
        undoLabel:     "Cambiar página",
        undoOffset:    "Desplazamiento global de páginas",
        previewError:  "Vista previa no disponible.",
        licPanel:      "Licencia",
        trialBanner:   "Prueba: {n} día(s) restante(s)",
        expiredBanner: "Prueba caducada — funciones bloqueadas",
        proBanner:     "Versión Pro",
        emailLbl:      "Email de compra:",
        keyLbl:        "Clave de licencia:",
        activateBtn:   "Activar",
        activateOk:    "Licencia activada correctamente!",
        activateErr:   "Clave no válida. Inténtelo de nuevo.",
        buyBtn:        "Comprar licencia →",
        blockedMsg:    "Esta función requiere la versión Pro.\nActive su licencia o compre en el sitio web."
    },
    it: {
        winTitle:      "Navigatore PDF",
        filePanel:     "File sorgente",
        pagePanel:     "Pagina da visualizzare",
        offsetPanel:   "Offset globale",
        offsetLabel:   "Sposta tutte le istanze dello stesso file:",
        applyOffset:   "Applica",
        layerPanel:    "Livelli",
        previewPanel:  "Anteprima",
        showPreview:   "Mostra anteprima",
        totalPages:    "Pagine totali:",
        noPreview:     "Attiva \"Mostra anteprima\".",
        noLayers:      "Nessun livello rilevato.",
        noLayersHint:  "(Solo PDF/AI con livelli OCG)",
        showAll:       "Mostra tutto",
        hideAll:       "Nascondi tutto",
        pages:         "pagine",
        close:         "Chiudi",
        apply:         "Applica",
        refresh:       "↺ Aggiorna",
        layer:         "Livello",
        invalidPage:   "Numero di pagina non valido.",
        invalidOffset: "Offset non valido (intero richiesto).",
        pageOver:      "Questo file ha {t} pagine.",
        noDoc:         "Nessun documento aperto.",
        noSel:         "Seleziona un riquadro con un file posizionato.",
        noFile:        "File sorgente non trovato su disco.",
        undoLabel:     "Cambia pagina",
        undoOffset:    "Offset globale pagine",
        previewError:  "Anteprima non disponibile.",
        licPanel:      "Licenza",
        trialBanner:   "Prova: {n} giorno/i rimanente/i",
        expiredBanner: "Prova scaduta — funzioni bloccate",
        proBanner:     "Versione Pro",
        emailLbl:      "Email di acquisto:",
        keyLbl:        "Chiave di licenza:",
        activateBtn:   "Attiva",
        activateOk:    "Licenza attivata con successo!",
        activateErr:   "Chiave non valida. Riprovare.",
        buyBtn:        "Acquista licenza →",
        blockedMsg:    "Questa funzione richiede la versione Pro.\nAttiva la licenza o acquista sul sito."
    }
};

var langKeys  = ['fr', 'en', 'de', 'es', 'it'];
var langFlags = ['FR', 'EN', 'DE', 'ES', 'IT'];
var langNames = ['Français', 'English', 'Deutsch', 'Español', 'Italiano'];

// ─── VARIABLES GLOBALES ───────────────────────────────────────────────────────
var T              = translations[pdfNavLang];
var pdfFrame       = null;
var pdfGraphic     = null;
var pdfFilePath    = '';
var currentPageNum = 1;
var totalPageCount = 0;
var shortName      = '';
var totalLabel     = '?';
var fileExt        = '';

var PREV_W = 300;
var PREV_H = 340;
var previewImgEl   = null;
var previewTmpFile = null;
var previewLastError = '';

// ─── UTILITAIRES ──────────────────────────────────────────────────────────────
function getFileExt(fp) {
    var parts = fp.split('.');
    return parts.length < 2 ? '' : parts[parts.length - 1].toLowerCase();
}

function fileSupportsPages(ext) {
    return (ext === 'pdf' || ext === 'ai' || ext === 'indd');
}

// ─── REFERENCE GRAPHIQUE FRAICHE ──────────────────────────────────────────────
function refreshGraphicRef() {
    if (!pdfFrame) return false;
    try {
        if (pdfFrame.isValid && pdfFrame.graphics.length > 0) {
            pdfGraphic = pdfFrame.graphics[0];
            return true;
        }
    } catch(e) {}
    return false;
}

// ─── CALQUES OCG ──────────────────────────────────────────────────────────────
function readLayerOptions() {
    var result = { opts: null, count: 0 };
    if (!refreshGraphicRef()) return result;
    try {
        var opts = pdfGraphic.objectLayerOptions;
        if (!opts) return result;
        var len = 0;
        try { len = opts.length; } catch(e) {}
        if (len > 0) { result.opts = opts; result.count = len; }
    } catch(e) {}
    return result;
}

// ─── COMPTAGE PAGES PDF ───────────────────────────────────────────────────────
function findCountInChunk(chunk) {
    var maxCount = 0;
    var tag = '/Count ';
    var idx = 0;
    while (true) {
        var pos = chunk.indexOf(tag, idx);
        if (pos === -1) break;
        var ns = pos + tag.length;
        var numStr = '';
        while (ns < chunk.length) {
            var ch = chunk.charAt(ns);
            if (ch >= '0' && ch <= '9') { numStr += ch; ns++; } else break;
        }
        if (numStr.length > 0) {
            var n = parseInt(numStr, 10);
            if (n > maxCount) maxCount = n;
        }
        idx = pos + 1;
    }
    return maxCount;
}

function getPDFPageCount(fp) {
    var f = new File(fp);
    if (!f.exists) return 0;
    var fileSize = 0;
    try { f.encoding = 'BINARY'; f.open('r'); fileSize = f.length; f.close(); }
    catch(e) { try { f.close(); } catch(ee) {} return 0; }
    if (fileSize === 0) return 0;

    var tailSize = Math.min(8192, fileSize);
    var tail = '';
    try {
        f = new File(fp); f.encoding = 'BINARY'; f.open('r');
        f.seek(fileSize - tailSize, 0); tail = f.read(tailSize); f.close();
    } catch(e) { try { f.close(); } catch(ee) {} return 0; }

    var xrefOffset = -1;
    var sxTag = 'startxref';
    var sxPos = -1;
    var sf = 0;
    while (true) {
        var found = tail.indexOf(sxTag, sf);
        if (found === -1) break;
        sxPos = found; sf = found + 1;
    }
    if (sxPos !== -1) {
        var ax = sxPos + sxTag.length;
        while (ax < tail.length) {
            var c = tail.charAt(ax);
            if (c === ' ' || c === '\r' || c === '\n' || c === '\t') ax++;
            else break;
        }
        var os = '';
        while (ax < tail.length) {
            var d = tail.charAt(ax);
            if (d >= '0' && d <= '9') { os += d; ax++; } else break;
        }
        if (os.length > 0) xrefOffset = parseInt(os, 10);
    }

    if (xrefOffset >= 0 && xrefOffset < fileSize) {
        var chunkSize = Math.min(131072, fileSize - xrefOffset);
        var xrefChunk = '';
        try {
            f = new File(fp); f.encoding = 'BINARY'; f.open('r');
            f.seek(xrefOffset, 0); xrefChunk = f.read(chunkSize); f.close();
        } catch(e) { try { f.close(); } catch(ee) {} }
        var cFromXref = findCountInChunk(xrefChunk);
        if (cFromXref > 0) return cFromXref;
    }

    var best = 0;
    var blockSize = 262144;
    var bOffset = 0;
    while (bOffset < fileSize) {
        var toRead = Math.min(blockSize, fileSize - bOffset);
        var block = '';
        try {
            f = new File(fp); f.encoding = 'BINARY'; f.open('r');
            f.seek(bOffset, 0); block = f.read(toRead); f.close();
        } catch(e) { try { f.close(); } catch(ee) {} break; }
        var c2 = findCountInChunk(block);
        if (c2 > best) best = c2;
        bOffset += blockSize;
    }
    return best;
}

// ─── CHARGEMENT DU CADRE ──────────────────────────────────────────────────────
function loadSelectedFrame() {
    var doc;
    try { doc = app.activeDocument; } catch(e) { return false; }
    var sel = doc.selection;
    if (!sel || sel.length === 0) return false;
    var frame = sel[0];
    if (!frame || !frame.graphics || frame.graphics.length === 0) return false;

    var graphic;
    try { graphic = frame.graphics[0]; } catch(e) { return false; }

    var link, fp;
    try {
        link = graphic.itemLink;
        if (!link) return false;
        fp = link.filePath;
        if (!fp || fp === '') return false;
    } catch(e) { return false; }

    // Vérifier que le fichier source existe
    var srcFile = new File(fp);
    if (!srcFile.exists) { alert(T.noFile); return false; }

    pdfFrame       = frame;
    pdfGraphic     = graphic;
    pdfFilePath    = fp;
    fileExt        = getFileExt(fp);
    currentPageNum = 1;
    try { currentPageNum = pdfGraphic.pdfAttributes.pageNumber; } catch(e) {}

    var parts = fp.split('/');
    shortName = parts[parts.length - 1];

    if (fileSupportsPages(fileExt)) {
        totalPageCount = getPDFPageCount(fp);
        totalLabel     = totalPageCount > 0 ? String(totalPageCount) : '?';
    } else {
        totalPageCount = 0;
        totalLabel     = '1';
    }
    return true;
}

// ─── VERIF INITIALE ───────────────────────────────────────────────────────────
try { app.activeDocument; } catch(e) { alert(T.noDoc); exit(); }
if (!loadSelectedFrame()) { alert(T.noSel); exit(); }

// ─── PLACE AVEC RESTAURATION TRANSFORM ───────────────────────────────────────
// Sauvegarde et restaure l'itemTransform du contenu après place()
// pour conserver l'échelle et la position dans le cadre.
function placePageInFrame(frame, filePath, pageNum) {
    var savedTransform = null;
    try { savedTransform = frame.graphics[0].itemTransform; } catch(e) {}

    var savedPage = app.pdfPlacePreferences.pageNumber;
    var savedCrop = app.pdfPlacePreferences.pdfCrop;
    try {
        app.pdfPlacePreferences.pageNumber = pageNum;
        frame.place(new File(filePath));
    } finally {
        app.pdfPlacePreferences.pageNumber = savedPage;
        app.pdfPlacePreferences.pdfCrop    = savedCrop;
    }

    if (savedTransform !== null) {
        try { frame.graphics[0].itemTransform = savedTransform; } catch(e) {}
    }
}

// ─── APERCU ───────────────────────────────────────────────────────────────────
// Rendu via Swift/CoreGraphics natif macOS — aucun document InDesign créé.
// La première invocation compile le script (~5 s) ; les suivantes sont rapides.
function generatePreviewForPage(fp, pageNum) {
    previewLastError = '';
    if (!fp || !(new File(fp)).exists) return null;

    var tmpDir  = Folder.temp.fsName;
    var outPath = tmpDir + '/pdfnav_prev.jpg';
    var swPath  = tmpDir + '/pdfnav_render.swift';

    // Echapper un chemin pour usage dans une chaîne Swift / shell
    function shQ(s) { return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'; }

    // Script Swift CoreGraphics — fonctionne sur tout Mac avec Xcode/CLT
    var code = [
        'import Foundation',
        'import CoreGraphics',
        'import ImageIO',
        'let a = CommandLine.arguments',
        'guard a.count == 4, let pg = Int(a[2]), pg > 0 else { exit(1) }',
        'let pdfURL = URL(fileURLWithPath: a[1]) as CFURL',
        'guard let doc = CGPDFDocument(pdfURL), let page = doc.page(at: pg) else { exit(1) }',
        'var box = page.getBoxRect(.cropBox)',
        'if box.size.width <= 0 { box = page.getBoxRect(.mediaBox) }',
        'let s = min(300.0 / box.size.width, 340.0 / box.size.height)',
        'let w = Int(ceil(box.size.width * s)), h = Int(ceil(box.size.height * s))',
        'let cs = CGColorSpaceCreateDeviceRGB()',
        'let bi = CGBitmapInfo(rawValue: CGImageAlphaInfo.noneSkipLast.rawValue)',
        'guard let ctx = CGContext(data: nil, width: w, height: h,',
        '    bitsPerComponent: 8, bytesPerRow: 0, space: cs, bitmapInfo: bi.rawValue) else { exit(1) }',
        'if let white = CGColor(colorSpace: cs, components: [1.0, 1.0, 1.0, 1.0]) {',
        '    ctx.setFillColor(white); ctx.fill(CGRect(x:0, y:0, width:w, height:h)) }',
        'ctx.scaleBy(x: s, y: s)',
        'ctx.translateBy(x: -box.origin.x, y: -box.origin.y)',
        'ctx.drawPDFPage(page)',
        'guard let img = ctx.makeImage() else { exit(1) }',
        'let oURL = URL(fileURLWithPath: a[3]) as CFURL',
        'guard let dest = CGImageDestinationCreateWithURL(oURL, "public.jpeg" as CFString, 1, nil) else { exit(1) }',
        'CGImageDestinationAddImage(dest, img, [kCGImageDestinationLossyCompressionQuality: 0.85] as CFDictionary)',
        '_ = CGImageDestinationFinalize(dest)'
    ].join('\n');

    // Ecrire le script Swift (fins de ligne Unix explicites)
    var swFile = new File(swPath);
    try {
        swFile.lineFeed = 'Unix';
        swFile.open('w');
        swFile.write(code);
        swFile.close();
    } catch(e) { previewLastError = 'Write swift: ' + e.message; return null; }

    try {
        var old = new File(outPath);
        if (old.exists) old.remove();

        // Construire la commande shell
        var cmd = 'swift ' + shQ(swPath) + ' ' + shQ(fp) + ' ' + pageNum + ' ' + shQ(outPath);
        app.doScript('do shell script ' + shQ(cmd),
                     ScriptLanguage.APPLESCRIPT_LANGUAGE);

        var out = new File(outPath);
        if (out.exists) return out;
        previewLastError = 'File not created after render';
        return null;
    } catch(e) {
        previewLastError = String(e.message || e);
        return null;
    }
}

// Met à jour la zone image sans re-layout : le conteneur a des dimensions
// fixes (min = max = preferred) donc aucun décalage à chaque appel.
function refreshPreviewPanel() {
    T = translations[pdfNavLang];
    if (!showPreviewCb || !showPreviewCb.value) return;

    while (previewContainer.children.length > 0) {
        try { previewContainer.remove(previewContainer.children[0]); } catch(e) { break; }
    }
    previewImgEl = null;

    var pageNum = parseInt(pageInput.text, 10);
    if (isNaN(pageNum) || pageNum < 1) pageNum = currentPageNum;

    var imgFile = generatePreviewForPage(pdfFilePath, pageNum);
    if (imgFile && imgFile.exists) {
        try {
            previewImgEl = previewContainer.add('image', [0, 0, PREV_W, PREV_H], imgFile);
        } catch(e) {
            previewContainer.add('statictext', [0, 0, PREV_W, 20], T.previewError);
        }
    } else {
        previewContainer.add('statictext', [0, 0, PREV_W, 20], T.previewError);
    }
    // PAS de layout.layout() — le conteneur fixe empêche tout décalage
}

// ─── DECALAGE GLOBAL ──────────────────────────────────────────────────────────
function applyGlobalOffset(offset) {
    var doc;
    try { doc = app.activeDocument; } catch(e) { return; }
    var targetPath = pdfFilePath;

    function doOffset() {
        var allFrames = doc.allPageItems;
        for (var i = 0; i < allFrames.length; i++) {
            var item = allFrames[i];
            try {
                if (!item.graphics || item.graphics.length === 0) continue;
                var g    = item.graphics[0];
                var link = g.itemLink;
                if (!link || link.filePath !== targetPath) continue;

                var curPage = 1;
                try { curPage = g.pdfAttributes.pageNumber; } catch(e) {}

                var newPage = curPage + offset;
                if (newPage < 1) newPage = 1;
                if (totalPageCount > 0 && newPage > totalPageCount) newPage = totalPageCount;
                if (newPage === curPage) continue;

                placePageInFrame(item, targetPath, newPage);
            } catch(e) {}
        }
    }

    app.doScript(doOffset, ScriptLanguage.JAVASCRIPT, undefined,
        UndoModes.ENTIRE_SCRIPT, T.undoOffset);

    // Resynchroniser la page courante affichée
    try {
        if (pdfFrame && pdfFrame.isValid && pdfFrame.graphics.length > 0) {
            currentPageNum = pdfFrame.graphics[0].pdfAttributes.pageNumber;
            pageInput.text = String(currentPageNum);
        }
    } catch(e) {}
}

// ─── FENETRE ──────────────────────────────────────────────────────────────────
pdfWin = new Window('palette', T.winTitle);
pdfWin.orientation   = 'column';
pdfWin.alignChildren = ['fill', 'top'];
pdfWin.margins       = [10, 10, 10, 10];
pdfWin.spacing       = 8;
pdfWin.preferredSize.width = 380;

// ── Drapeaux ──────────────────────────────────────────────────────────────────
var flagBand = pdfWin.add('group');
flagBand.orientation   = 'row';
flagBand.alignChildren = ['center', 'center'];
flagBand.alignment     = ['center', 'top'];
flagBand.spacing       = 4;

var flagBtns = [];
for (var li = 0; li < langKeys.length; li++) {
    var isAct   = (langKeys[li] === pdfNavLang);
    var flagBtn = flagBand.add('button', [0, 0, 60, 26],
                  isAct ? ('[ ' + langFlags[li] + ' ]') : langFlags[li]);
    flagBtn.helpTip = langNames[li];
    flagBtn.langKey = langKeys[li];
    flagBtn.langIdx = li;
    flagBtns.push(flagBtn);
}

pdfWin.add('panel', [0, 0, 360, 2], '');

// ── Fichier + Refresh ─────────────────────────────────────────────────────────
var filePanel = pdfWin.add('panel', undefined, T.filePanel);
filePanel.orientation   = 'row';
filePanel.alignChildren = ['left', 'center'];
filePanel.margins       = [12, 18, 12, 12];
filePanel.spacing       = 8;

var fileLbl = filePanel.add('statictext', [0, 0, 216, 18], shortName, {truncate: 'middle'});
fileLbl.graphics.font = ScriptUI.newFont('dialog', 'BOLD', 11);

var refreshBtn = filePanel.add('button', [0, 0, 94, 24], T.refresh);

// ── Aperçu (image + navigation intégrée, style dialog d'import InDesign) ──────
var previewPanel = pdfWin.add('panel', undefined, T.previewPanel);
previewPanel.orientation   = 'column';
previewPanel.alignChildren = ['center', 'top'];
previewPanel.margins       = [12, 18, 12, 12];
previewPanel.spacing       = 6;

// Conteneur image à dimensions FIXES — empêche tout décalage de layout
var previewContainer = previewPanel.add('group', [0, 0, PREV_W, PREV_H]);
previewContainer.preferredSize = [PREV_W, PREV_H];
previewContainer.minimumSize   = [PREV_W, PREV_H];
previewContainer.maximumSize   = [PREV_W, PREV_H];
previewContainer.alignment     = ['center', 'top'];
var previewImgEl = null;
previewContainer.add('statictext', [0, 0, PREV_W, 20], T.noPreview);

// Navigation |◀ ◀ [page] ▶ ▶|
var navRow = previewPanel.add('group');
navRow.orientation   = 'row';
navRow.alignChildren = ['center', 'center'];
navRow.alignment     = ['center', 'top'];
navRow.spacing       = 4;

var firstBtn   = navRow.add('button', [0, 0, 32, 28], '\u00AB'); // premier
var prevBtn    = navRow.add('button', [0, 0, 32, 28], '\u276E');
var pageInput  = navRow.add('edittext', [0, 0, 50, 28], String(currentPageNum));
pageInput.justify = 'center';
var nextBtn    = navRow.add('button', [0, 0, 32, 28], '\u276F');
var lastBtn    = navRow.add('button', [0, 0, 32, 28], '\u00BB'); // dernier

// Total des pages
var totalPagesLbl = previewPanel.add('statictext', undefined,
    T.totalPages + ' ' + totalLabel);
totalPagesLbl.alignment = ['center', 'top'];

// Case "Afficher l'aperçu"
var showPreviewCb = previewPanel.add('checkbox', undefined, T.showPreview);
showPreviewCb.value    = false;
showPreviewCb.alignment = ['left', 'top'];

// Navigation callbacks — maj automatique preview si case cochée
firstBtn.onClick = function() {
    pageInput.text = '1';
    if (showPreviewCb.value) refreshPreviewPanel();
};
prevBtn.onClick = function() {
    var p = parseInt(pageInput.text, 10);
    if (!isNaN(p) && p > 1) {
        pageInput.text = String(p - 1);
        if (showPreviewCb.value) refreshPreviewPanel();
    }
};
nextBtn.onClick = function() {
    var p = parseInt(pageInput.text, 10);
    if (!isNaN(p) && (totalPageCount === 0 || p < totalPageCount)) {
        pageInput.text = String(p + 1);
        if (showPreviewCb.value) refreshPreviewPanel();
    }
};
lastBtn.onClick = function() {
    if (totalPageCount > 0) {
        pageInput.text = String(totalPageCount);
        if (showPreviewCb.value) refreshPreviewPanel();
    }
};
pageInput.onDeactivate = function() {
    if (showPreviewCb.value) refreshPreviewPanel();
};
showPreviewCb.onClick = function() {
    if (showPreviewCb.value) refreshPreviewPanel();
    else {
        while (previewContainer.children.length > 0) {
            try { previewContainer.remove(previewContainer.children[0]); } catch(e) { break; }
        }
        previewContainer.add('statictext', [0, 0, PREV_W, 20], T.noPreview);
    }
};

// ── Boutons principaux (toujours visibles) ────────────────────────────────────
var btnGrp   = pdfWin.add('group');
btnGrp.alignment = ['right', 'top'];
btnGrp.spacing   = 8;
var closeBtn = btnGrp.add('button', [0, 0, 90, 28], T.close);
var applyBtn = btnGrp.add('button', [0, 0, 90, 28], T.apply);

// ── Décalage global ───────────────────────────────────────────────────────────
var offsetPanel = pdfWin.add('panel', undefined, T.offsetPanel);
offsetPanel.orientation   = 'column';
offsetPanel.alignChildren = ['left', 'top'];
offsetPanel.margins       = [12, 18, 12, 12];
offsetPanel.spacing       = 6;

var offsetLblEl = offsetPanel.add('statictext', undefined, T.offsetLabel);
offsetLblEl.characters = 38;

var offsetRow = offsetPanel.add('group');
offsetRow.orientation   = 'row';
offsetRow.alignChildren = ['left', 'center'];
offsetRow.spacing       = 6;

var offsetPrevBtn  = offsetRow.add('button', [0, 0, 32, 28], '\u276E');
var offsetInput    = offsetRow.add('edittext', [0, 0, 54, 28], '0');
offsetInput.justify = 'center';
var offsetNextBtn  = offsetRow.add('button', [0, 0, 32, 28], '\u276F');
var offsetApplyBtn = offsetRow.add('button', [0, 0, 86, 28], T.applyOffset);

offsetPrevBtn.onClick = function() {
    var v = parseInt(offsetInput.text, 10);
    if (!isNaN(v)) offsetInput.text = String(v - 1);
};
offsetNextBtn.onClick = function() {
    var v = parseInt(offsetInput.text, 10);
    if (!isNaN(v)) offsetInput.text = String(v + 1);
};

// ── Calques ───────────────────────────────────────────────────────────────────
var layerPanel = pdfWin.add('panel', undefined, T.layerPanel);
layerPanel.orientation   = 'column';
layerPanel.alignChildren = ['left', 'top'];
layerPanel.margins       = [12, 18, 12, 12];
layerPanel.spacing       = 6;

var checkboxes = [];
var layerOpts  = null;
var numLayers  = 0;
var noLayerTxt = null;
var noLayerHint = null;
var showAllBtn = null;
var hideAllBtn = null;

function buildLayerPanel() {
    T = translations[pdfNavLang];
    while (layerPanel.children.length > 0) {
        try { layerPanel.remove(layerPanel.children[0]); } catch(e) { break; }
    }
    checkboxes = []; layerOpts = null; numLayers = 0;
    noLayerTxt = null; noLayerHint = null; showAllBtn = null; hideAllBtn = null;

    var lr = readLayerOptions();
    layerOpts = lr.opts; numLayers = lr.count;

    if (numLayers > 0) {
        for (var ci = 0; ci < numLayers; ci++) {
            var lo           = layerOpts[ci];
            var layerVis     = true;
            var layerNameStr = T.layer + ' ' + (ci + 1);
            try { layerVis     = lo.visibility; } catch(e) {}
            try { layerNameStr = lo.layerName;  } catch(e) {}
            var cb        = layerPanel.add('checkbox', undefined, layerNameStr);
            cb.value      = layerVis;
            cb.layerIndex = ci;
            checkboxes.push(cb);
        }
        var toggleGrp = layerPanel.add('group');
        toggleGrp.spacing = 6;
        showAllBtn = toggleGrp.add('button', [0, 0, 128, 24], T.showAll);
        hideAllBtn = toggleGrp.add('button', [0, 0, 128, 24], T.hideAll);
        showAllBtn.onClick = function() { for (var k = 0; k < checkboxes.length; k++) checkboxes[k].value = true; };
        hideAllBtn.onClick = function() { for (var k = 0; k < checkboxes.length; k++) checkboxes[k].value = false; };
    } else {
        noLayerTxt  = layerPanel.add('statictext', undefined, T.noLayers);
        noLayerHint = layerPanel.add('statictext', [0, 0, 330, 28], T.noLayersHint);
    }
    try { layerPanel.layout.layout(true); } catch(e) {}
    try { pdfWin.layout.layout(true);     } catch(e) {}
}

buildLayerPanel();


// ─── MISE A JOUR LABELS ───────────────────────────────────────────────────────
function updateLabels() {
    T = translations[pdfNavLang];
    pdfWin.text          = T.winTitle;
    filePanel.text       = T.filePanel;
    offsetPanel.text     = T.offsetPanel;
    layerPanel.text      = T.layerPanel;
    previewPanel.text    = T.previewPanel;
    totalPagesLbl.text   = T.totalPages + ' ' + totalLabel;
    showPreviewCb.text   = T.showPreview;
    refreshBtn.text      = T.refresh;
    offsetLblEl.text     = T.offsetLabel;
    offsetApplyBtn.text  = T.applyOffset;
    if (noLayerTxt  !== null) noLayerTxt.text  = T.noLayers;
    if (noLayerHint !== null) noLayerHint.text = T.noLayersHint;
    if (showAllBtn  !== null) showAllBtn.text  = T.showAll;
    if (hideAllBtn  !== null) hideAllBtn.text  = T.hideAll;
    closeBtn.text = T.close;
    applyBtn.text = T.apply;
    for (var fi = 0; fi < flagBtns.length; fi++) {
        flagBtns[fi].text = (flagBtns[fi].langKey === pdfNavLang)
            ? ('[ ' + langFlags[fi] + ' ]') : langFlags[fi];
    }
}

// ─── REFRESH ──────────────────────────────────────────────────────────────────
function doRefresh() {
    T = translations[pdfNavLang];
    if (!loadSelectedFrame()) { alert(T.noSel); return; }
    fileLbl.text       = shortName;
    pageInput.text     = String(currentPageNum);
    totalPagesLbl.text = T.totalPages + ' ' + totalLabel;
    buildLayerPanel();
    if (showPreviewCb.value) refreshPreviewPanel();
}

refreshBtn.onClick = function() { doRefresh(); };

// ─── CALLBACKS DRAPEAUX ───────────────────────────────────────────────────────
for (var bi = 0; bi < flagBtns.length; bi++) {
    (function(btn, key) {
        btn.onClick = function() { pdfNavLang = key; updateLabels(); };
    })(flagBtns[bi], langKeys[bi]);
}

// ─── APPLIQUER PAGE ───────────────────────────────────────────────────────────
applyBtn.onClick = function() {
    T = translations[pdfNavLang];
    if (pdfNavLicStatus.mode === 'expired') { alert(T.blockedMsg); return; }

    // Valider page
    var newPageNum = parseInt(pageInput.text, 10);
    if (isNaN(newPageNum) || newPageNum < 1) { alert(T.invalidPage); return; }
    if (totalPageCount > 0 && newPageNum > totalPageCount) {
        alert(T.pageOver.replace('{t}', totalPageCount));
        return;
    }

    // Vérifier fichier source
    if (!(new File(pdfFilePath)).exists) { alert(T.noFile); return; }

    var capturedCbs   = checkboxes;
    var capturedLOpts = layerOpts;
    var capturedPath  = pdfFilePath;
    var capturedFrame = pdfFrame;
    var capturedExt   = fileExt;

    function doApply() {
        placePageInFrame(capturedFrame, capturedPath, newPageNum);

        // Appliquer les calques APRES place() via reference fraiche
        if (capturedLOpts !== null && capturedCbs.length > 0) {
            try {
                var freshGraphic = capturedFrame.graphics[0];
                var freshOpts    = freshGraphic.objectLayerOptions;
                for (var j = 0; j < capturedCbs.length; j++) {
                    try {
                        freshOpts[capturedCbs[j].layerIndex].visibility = capturedCbs[j].value;
                    } catch(e) {}
                }
            } catch(e) {}
        }

        // Rafraîchir la référence globale
        try { pdfGraphic = capturedFrame.graphics[0]; } catch(e) {}
    }

    app.doScript(doApply, ScriptLanguage.JAVASCRIPT, undefined,
        UndoModes.ENTIRE_SCRIPT, T.undoLabel);

    currentPageNum = newPageNum;
};

// ─── APPLIQUER DECALAGE GLOBAL ────────────────────────────────────────────────
offsetApplyBtn.onClick = function() {
    T = translations[pdfNavLang];
    if (pdfNavLicStatus.mode === 'expired') { alert(T.blockedMsg); return; }
    var offset = parseInt(offsetInput.text, 10);
    if (isNaN(offset)) { alert(T.invalidOffset); return; }
    if (offset === 0) return;
    applyGlobalOffset(offset);
    offsetInput.text = '0';
};

// ─── FERMER ───────────────────────────────────────────────────────────────────
closeBtn.onClick = function() { pdfWin.hide(); };
pdfWin.onClose   = function() { pdfWin.hide(); return false; };

// ─── PANEL LICENCE ───────────────────────────────────────────────────────────
var licPanel = pdfWin.add('panel', undefined, T.licPanel);
licPanel.orientation   = 'column';
licPanel.alignChildren = ['fill', 'top'];
licPanel.margins       = [12, 18, 12, 10];
licPanel.spacing       = 6;

// Bannière de statut
var licBannerGrp = licPanel.add('group');
licBannerGrp.orientation   = 'row';
licBannerGrp.alignChildren = ['left', 'center'];
licBannerGrp.spacing       = 8;

var licStatusLbl = licBannerGrp.add('statictext', undefined, '');
licStatusLbl.graphics.font = ScriptUI.newFont('dialog', 'BOLD', 11);

var licBuyBtn = null;

function buildLicPanel() {
    T = translations[pdfNavLang];
    var st = pdfNavLicStatus;

    if (st.mode === 'pro') {
        licStatusLbl.text = '\u2713 ' + T.proBanner + ' — ' + st.email;
        licStatusLbl.graphics.foregroundColor =
            licStatusLbl.graphics.newPen(licStatusLbl.graphics.PenType.SOLID_COLOR, [0.2, 0.7, 0.2, 1], 1);
        // Masquer champs activation si présents
        if (typeof licActGrp !== 'undefined' && licActGrp) {
            try { licActGrp.visible = false; } catch(e) {}
        }
    } else if (st.mode === 'trial') {
        var msg = T.trialBanner.replace('{n}', st.daysLeft);
        licStatusLbl.text = '\u23F1 ' + msg;
        licStatusLbl.graphics.foregroundColor =
            licStatusLbl.graphics.newPen(licStatusLbl.graphics.PenType.SOLID_COLOR, [0.9, 0.6, 0.1, 1], 1);
    } else {
        licStatusLbl.text = '\u26A0 ' + T.expiredBanner;
        licStatusLbl.graphics.foregroundColor =
            licStatusLbl.graphics.newPen(licStatusLbl.graphics.PenType.SOLID_COLOR, [0.85, 0.15, 0.15, 1], 1);
    }
}

buildLicPanel();

// Bouton Acheter (visible en trial + expired)
if (pdfNavLicStatus.mode !== 'pro') {
    licBuyBtn = licPanel.add('button', [0, 0, 200, 24], T.buyBtn);
    licBuyBtn.alignment = ['left', 'top'];
    licBuyBtn.onClick = function() {
        // Remplacer l'URL par votre page Lemon Squeezy
        var url = 'https://ciadesign.lemonsqueezy.com/buy/pdf-navigator';
        try {
            app.doScript('open location "' + url + '"',
                         ScriptLanguage.APPLESCRIPT_LANGUAGE);
        } catch(e) {}
    };
}

// Formulaire d'activation (visible en trial + expired)
if (pdfNavLicStatus.mode !== 'pro') {
    var licActGrp = licPanel.add('group');
    licActGrp.orientation   = 'column';
    licActGrp.alignChildren = ['fill', 'top'];
    licActGrp.spacing       = 4;

    licActGrp.add('statictext', undefined, T.emailLbl);
    var licEmailFld = licActGrp.add('edittext', [0, 0, 320, 24], '');
    licEmailFld.helpTip = 'email@example.com';

    licActGrp.add('statictext', undefined, T.keyLbl);
    var licKeyFld = licActGrp.add('edittext', [0, 0, 320, 24], '');
    licKeyFld.helpTip = 'PDFN-XXXXXXXX-XXXXXXXX';

    var licActBtn = licActGrp.add('button', [0, 0, 120, 26], T.activateBtn);
    licActBtn.alignment = ['right', 'top'];

    licActBtn.onClick = function() {
        T = translations[pdfNavLang];
        var em  = licEmailFld.text;
        var key = licKeyFld.text.replace(/\s/g, '');
        if (_navActivate(em, key)) {
            pdfNavLicStatus = _navStatus();
            alert(T.activateOk);
            // Cacher le formulaire, mettre à jour bannière
            licActGrp.visible = false;
            if (licBuyBtn) licBuyBtn.visible = false;
            licStatusLbl.text = '\u2713 ' + T.proBanner + ' — ' + pdfNavLicStatus.email;
            try { pdfWin.layout.layout(true); } catch(e) {}
        } else {
            alert(T.activateErr);
        }
    };
}

pdfWin.show();
