const plafondcotisations = 2101440;
    const reductionparpersonne = 2000;
    const irsaminimum = 3000;
    const heuresmensuelles = 173.33;
    const joursmensuelsabsence = 30;

    const tauxcnapsalarie = 0.01;
    const tauxostiesalarie = 0.01;
    const tauxcnapspatronal = 0.13;
    const tauxfmfp = 0.01;
    const tauxostiepatronal = 0.05;
    const tauxhs130 = 1.3;
    const tauxhs150 = 1.5;
    const tauxferies = 0.5;
    const tauxweekend = 0.4;

    const tranchesirsa = [
      { debut: 0, fin: 350000, taux: 0 },
      { debut: 350000, fin: 400000, taux: 0.05 },
      { debut: 400000, fin: 500000, taux: 0.10 },
      { debut: 500000, fin: 600000, taux: 0.15 },
      { debut: 600000, fin: 4000000, taux: 0.20 },
      { debut: 4000000, fin: Infinity, taux: 0.25 }
    ];

    let salaries = [];

    const variablespaiepardefaut = {
      congesutilises: 0,
      absence: 0,
      primes: 0,
      hs130: 0,
      hs150: 0,
      feries: 0,
      weekend: 0,
      personnesacharge: 0,
      avance: 0,
      avancespeciale: 0
    };

    const libellescolonnesmodele = {
      matricule: "Matricule",
      nom: "Nom",
      prenoms: "Prénoms",
      fonction: "Fonction",
      classification: "Classification",
      groupe: "Groupe",
      contrat: "Type de contrat",
      dateembauche: "Date d'embauche",
      salairebase: "Salaire de base mensuel",
      congesutilises: "Congés utilisés",
      absence: "Absences irrégulières (jours)",
      primes: "Primes et indemnités imposables",
      hs130: "Heures sup. 130% (heures)",
      hs150: "Heures sup. 150% (heures)",
      feries: "Jours fériés travaillés (heures)",
      weekend: "Week-end travaillé (heures)",
      personnesacharge: "Personnes à charge",
      avance: "Avance sur salaire",
      avancespeciale: "Avance spéciale"
    };

    const formatariary = new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0
    });

    const nomsmois = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    const ids = ["moispaie", "matricule"];

    const champs = {};

    for (const id of ids) {
      champs[id] = document.querySelector("#" + id);
    }

    const lignesgains = document.querySelector("#lignes-gains");
    const lignesretenues = document.querySelector("#lignes-retenues");
    const lignespatronales = document.querySelector("#lignes-patronales");
    const generertoutesfiches = document.querySelector("#generertoutesfiches");
    const genereretatpaie = document.querySelector("#genereretatpaie");
    const telechargermodele = document.querySelector("#telechargermodele");
    const importerbase = document.querySelector("#importerbase");
    const fichierbase = document.querySelector("#fichierbase");
    const lotpaie = document.querySelector("#lotpaie");
    const etatpaie = document.querySelector("#etatpaie");
    const messagebase = document.querySelector("#messagebase");

    function salarieactuel() {
      return salaries.find(function (salarie) {
        return salarie.matricule === champs.matricule.value;
      }) || {};
    }

    function texte(id) {
      if (champs[id]) {
        return champs[id].value.trim();
      }

      const salarie = salarieactuel();

      if (id === "dateembauche") {
        return datefrancaise(salarie.dateembauche);
      }

      if (id === "contrat") {
        return salarie.contrat || "CDI";
      }

      return String(salarie[id] ?? "").trim();
    }

    function affichermessagebase(message) {
      messagebase.textContent = message;
    }

    function datefrancaise(valeur) {
      if (!valeur) {
        return "";
      }

      if (valeur instanceof Date) {
        const jour = String(valeur.getDate()).padStart(2, "0");
        const mois = String(valeur.getMonth() + 1).padStart(2, "0");
        return jour + "/" + mois + "/" + valeur.getFullYear();
      }

      if (String(valeur).includes("/")) {
        return valeur;
      }

      const morceaux = String(valeur).split("-");

      if (morceaux.length !== 3) {
        return valeur;
      }

      return morceaux[2] + "/" + morceaux[1] + "/" + morceaux[0];
    }

    function dateiso(valeur) {
      if (!valeur) {
        return "";
      }

      if (valeur instanceof Date) {
        const jour = String(valeur.getDate()).padStart(2, "0");
        const mois = String(valeur.getMonth() + 1).padStart(2, "0");
        return valeur.getFullYear() + "-" + mois + "-" + jour;
      }

      const texte = String(valeur).trim();

      if (texte.includes("-")) {
        return texte;
      }

      const morceaux = texte.split("/");

      if (morceaux.length !== 3) {
        return texte;
      }

      return morceaux[2] + "-" + morceaux[1].padStart(2, "0") + "-" + morceaux[0].padStart(2, "0");
    }

    function finmoispaie() {
      const morceaux = texte("moispaie").split("-");

      if (morceaux.length !== 2) {
        return new Date();
      }

      return new Date(Number(morceaux[0]), Number(morceaux[1]), 0);
    }

    function calculercongesacquis(dateembauche) {
      const iso = dateiso(dateembauche);

      if (!iso) {
        return 0;
      }

      const embauche = new Date(iso + "T00:00:00");
      const finperiode = finmoispaie();

      if (Number.isNaN(embauche.getTime()) || embauche > finperiode) {
        return 0;
      }

      const millisecondesjour = 24 * 60 * 60 * 1000;
      const joursservice = Math.floor((finperiode - embauche) / millisecondesjour) + 1;
      const acquis = (joursservice / 30) * 2.5;

      return Math.max(0, Math.round(acquis * 2) / 2);
    }

    function preparerlisteemployes(matriculeachoisi = texte("matricule")) {
      champs.matricule.innerHTML = "";

      for (const salarie of salaries) {
        const option = document.createElement("option");
        option.value = salarie.matricule;
        option.textContent = salarie.matricule + " - " + salarie.nom + " " + salarie.prenoms;
        champs.matricule.appendChild(option);
      }

      if (salaries.some(function (salarie) { return salarie.matricule === matriculeachoisi; })) {
        champs.matricule.value = matriculeachoisi;
      } else if (salaries.length > 0) {
        champs.matricule.value = salaries[0].matricule;
      }
    }

    function libellemodele(colonne) {
      return libellescolonnesmodele[colonne] || colonne;
    }

    function telechargermodelesalaries() {
      const lien = document.createElement("a");
      lien.href = "assets/modele_salaries_falinwa.xlsx";
      lien.download = "modele_salaries_falinwa.xlsx";
      lien.click();
    }

    function clepropre(cle) {
      return String(cle)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
    }

    function lirecolonne(ligne, colonne) {
      const cherchee = clepropre(colonne);

      for (const cle in ligne) {
        if (clepropre(cle) === cherchee) {
          return ligne[cle];
        }
      }

      return "";
    }

    function lirechamp(ligne, colonne) {
      const variantes = [colonne, libellemodele(colonne)];

      for (const variante of variantes) {
        const valeur = lirecolonne(ligne, variante);

        if (valeur !== "") {
          return valeur;
        }
      }

      return "";
    }

    function nombreimporte(valeur) {
      if (valeur === "" || valeur === null || valeur === undefined) {
        return 0;
      }

      let texte = String(valeur)
        .replace(/[\s\u00A0\u202F]/g, "")
        .trim();

      if (/^-?\d{1,3}([.,]\d{3})+$/.test(texte)) {
        texte = texte.replace(/[.,]/g, "");
      } else if (texte.includes(",") && texte.includes(".")) {
        const dernierevirgule = texte.lastIndexOf(",");
        const dernierpoint = texte.lastIndexOf(".");
        const decimal = dernierevirgule > dernierpoint ? "," : ".";
        const millier = decimal === "," ? "." : ",";
        texte = texte.replace(new RegExp("\\" + millier, "g"), "").replace(decimal, ".");
      } else {
        texte = texte.replace(",", ".");
      }

      return Number(texte) || 0;
    }

    function normalisersalarie(ligne) {
      const salarie = {
        matricule: String(lirechamp(ligne, "matricule")).trim(),
        nom: String(lirechamp(ligne, "nom")).trim(),
        prenoms: String(lirechamp(ligne, "prenoms")).trim(),
        fonction: String(lirechamp(ligne, "fonction")).trim(),
        classification: String(lirechamp(ligne, "classification")).trim(),
        groupe: String(lirechamp(ligne, "groupe")).trim(),
        contrat: String(lirechamp(ligne, "contrat") || "CDI").trim(),
        dateembauche: dateiso(lirechamp(ligne, "dateembauche")),
        salairebase: nombreimporte(lirechamp(ligne, "salairebase"))
      };

      for (const cle in variablespaiepardefaut) {
        salarie[cle] = nombreimporte(lirechamp(ligne, cle));
      }

      return salarie;
    }

    function parsercsv(textecsv) {
      const lignes = textecsv.replace(/^\uFEFF/, "").split(/\r?\n/).filter(function (ligne) {
        return ligne.trim() !== "";
      });
      const separateur = (lignes[0].match(/;/g) || []).length >= (lignes[0].match(/,/g) || []).length ? ";" : ",";

      function decouper(ligne) {
        const cellules = [];
        let valeur = "";
        let guillemets = false;

        for (let i = 0; i < ligne.length; i++) {
          const caractere = ligne[i];
          const suivant = ligne[i + 1];

          if (caractere === '"' && suivant === '"') {
            valeur = valeur + '"';
            i++;
          } else if (caractere === '"') {
            guillemets = !guillemets;
          } else if (caractere === separateur && !guillemets) {
            cellules.push(valeur);
            valeur = "";
          } else {
            valeur = valeur + caractere;
          }
        }

        cellules.push(valeur);
        return cellules;
      }

      const entetes = decouper(lignes[0]);

      return lignes.slice(1).map(function (ligne) {
        const cellules = decouper(ligne);
        const objet = {};

        entetes.forEach(function (entete, index) {
          objet[entete] = cellules[index] || "";
        });

        return objet;
      });
    }

    function remplacerbase(lignes) {
      const nouveauxsalaries = lignes.map(normalisersalarie).filter(function (salarie) {
        return salarie.matricule && salarie.nom && salarie.prenoms;
      });

      if (nouveauxsalaries.length === 0) {
        affichermessagebase("Aucun salarié valide trouvé dans le fichier.");
        return;
      }

      salaries = nouveauxsalaries;
      preparerlisteemployes(salaries[0].matricule);
      calculerfiche();
      affichermessagebase(nouveauxsalaries.length + " salarié(s) importé(s).");
    }

    function importerfichierbase() {
      const fichier = fichierbase.files[0];

      if (!fichier) {
        affichermessagebase("Choisis d'abord un fichier Excel ou CSV.");
        return;
      }

      const nom = fichier.name.toLowerCase();
      const lecteur = new FileReader();

      lecteur.onload = function () {
        if (nom.endsWith(".csv")) {
          remplacerbase(parsercsv(String(lecteur.result)));
          return;
        }

        if (!window.XLSX) {
          affichermessagebase("Le lecteur Excel n'est pas chargé. Tu peux importer le template en CSV sinon.");
          return;
        }

        const classeur = XLSX.read(lecteur.result, { type: "array", cellDates: true });
        const premierefeuille = classeur.Sheets[classeur.SheetNames[0]];
        const lignes = XLSX.utils.sheet_to_json(premierefeuille, { defval: "", raw: false });
        remplacerbase(lignes);
      };

      if (nom.endsWith(".csv")) {
        lecteur.readAsText(fichier, "utf-8");
      } else {
        lecteur.readAsArrayBuffer(fichier);
      }
    }

    function periodecomplete() {
      const morceaux = texte("moispaie").split("-");

      if (morceaux.length !== 2) {
        return "";
      }

      const annee = Number(morceaux[0]);
      const mois = Number(morceaux[1]);
      const dernierjour = new Date(annee, mois, 0).getDate();

      return "01 au " + String(dernierjour).padStart(2, "0") + " " + nomsmois[mois - 1] + " " + annee;
    }

    function ariary(montant) {
      return formatariary.format(Math.round(montant)) + " Ar";
    }

    function taux(valeur) {
      return valeur * 100 + "%";
    }

    function tauxhoraire(salairebase) {
      return salairebase / heuresmensuelles;
    }

    function montantabsence(salairebase, joursabsence) {
      return (salairebase / joursmensuelsabsence) * joursabsence;
    }

    function centaineinferieure(montant) {
      return Math.floor(montant / 100) * 100;
    }

    function retenue(montant) {
      if (montant === 0) {
        return ariary(0);
      }

      return "-" + ariary(montant);
    }

    function ligne(libelle, base, montant, classe = "") {
      return "<tr class='" + classe + "'><td>" + libelle + "</td><td>" + base + "</td><td>" + montant + "</td></tr>";
    }

    function calculerirsa(baseimposable) {
      let irsa = 0;

      for (const tranche of tranchesirsa) {
        const montanttranche = Math.max(0, Math.min(baseimposable, tranche.fin) - tranche.debut);
        irsa = irsa + montanttranche * tranche.taux;
      }

      return irsa;
    }

    function nombreenlettres(nombre) {
      const unites = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize"];
      const dizaines = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"];

      function souscent(n) {
        if (n < 17) return unites[n];
        if (n < 20) return "dix-" + unites[n - 10];
        if (n < 70) {
          const d = Math.floor(n / 10);
          const u = n % 10;
          if (u === 0) return dizaines[d];
          if (u === 1) return dizaines[d] + " et un";
          return dizaines[d] + "-" + unites[u];
        }
        if (n < 80) return "soixante-" + souscent(n - 60);
        if (n === 80) return "quatre-vingts";
        return "quatre-vingt-" + souscent(n - 80);
      }

      function sousmille(n) {
        const c = Math.floor(n / 100);
        const reste = n % 100;
        let texte = "";

        if (c > 0) {
          texte = c === 1 ? "cent" : unites[c] + " cent";
          if (reste === 0 && c > 1) texte = texte + "s";
        }

        if (reste > 0) {
          texte = texte ? texte + " " + souscent(reste) : souscent(reste);
        }

        return texte;
      }

      function groupe(n, nom) {
        if (n === 0) return "";
        if (nom === "mille") return n === 1 ? "mille" : sousmille(n) + " mille";
        return n === 1 ? "un " + nom : sousmille(n) + " " + nom + "s";
      }

      if (nombre === 0) return "zéro";

      const millions = Math.floor(nombre / 1000000);
      const milliers = Math.floor((nombre % 1000000) / 1000);
      const reste = nombre % 1000;
      const morceaux = [];

      if (millions > 0) morceaux.push(groupe(millions, "million"));
      if (milliers > 0) morceaux.push(groupe(milliers, "mille"));
      if (reste > 0) morceaux.push(sousmille(reste));

      return morceaux.join(" ");
    }

    function mettretexte(id, valeur) {
      document.querySelector("#" + id).textContent = valeur;
    }

    function calculerfiche() {
      const salarie = salarieactuel();
      const montants = calculermontantssalarie(salarie);
      const congesacquis = calculercongesacquis(salarie.dateembauche);
      const congesutilises = valeurpaiesalarie(salarie, "congesutilises");

      mettretexte("apercu-periode", periodecomplete());
      mettretexte("apercu-nom", texte("nom"));
      mettretexte("apercu-prenoms", texte("prenoms"));
      mettretexte("apercu-matricule", texte("matricule"));
      mettretexte("apercu-fonction", texte("fonction"));
      mettretexte("apercu-classification", texte("classification"));
      mettretexte("apercu-groupe", texte("groupe"));
      mettretexte("apercu-contrat", texte("contrat"));
      mettretexte("apercu-dateembauche", texte("dateembauche"));
      mettretexte("apercu-congesacquis", congesacquis);
      mettretexte("apercu-congesutilises", congesutilises);
      mettretexte("apercu-congesrestants", congesacquis - congesutilises);

      lignesgains.innerHTML =
        ligne("Salaire de base", "-", ariary(montants.salairebase)) +
        ligne("Absence irrégulière", montants.joursabsence + " j x " + ariary(montants.salairebase / joursmensuelsabsence), retenue(montants.absence)) +
        ligne("Salaire du mois", "-", ariary(montants.salairemois)) +
        ligne("Primes / Indemnités", "-", ariary(montants.primes)) +
        ligne("Heures supplémentaires Total", "-", ariary(montants.totalheures)) +
        ligne("Heures sup. 130%", montants.heures130 + " h x " + ariary(montants.horaire) + " x 130%", ariary(montants.hs130)) +
        ligne("Heures sup. 150%", montants.heures150 + " h x " + ariary(montants.horaire) + " x 150%", ariary(montants.hs150)) +
        ligne("Majoration fériés", montants.heuresferies + " h x " + ariary(montants.horaire) + " x 50%", ariary(montants.feries)) +
        ligne("Majoration week-end", montants.heuresweekend + " h x " + ariary(montants.horaire) + " x 40%", ariary(montants.weekend)) +
        ligne("TOTAL BRUT", "-", ariary(montants.totalbrut), "total");

      lignesretenues.innerHTML =
        ligne("Cotisation CNaPS", taux(tauxcnapsalarie) + " sur " + ariary(montants.basecotisations), retenue(montants.cnapsalarie)) +
        ligne("Cotisation OSTIE", taux(tauxostiesalarie) + " sur " + ariary(montants.basecotisations), retenue(montants.ostiesalarie)) +
        ligne("SALAIRE AVANT IRSA", "-", ariary(montants.montantimposable), "total") +
        ligne("Montant imposable", "base IRSA", ariary(montants.montantimposable)) +
        ligne("IRSA correspondant", "barème progressif", ariary(montants.irsatheorique)) +
        ligne("Réduction d'impôt pour personne à charge", montants.personnes + " x " + ariary(reductionparpersonne), retenue(montants.reductionimpot)) +
        ligne("IRSA à payer", "-", retenue(montants.irsa)) +
        ligne("Avance sur salaire", "-", retenue(montants.avance)) +
        ligne("Avance spéciale", "-", retenue(montants.avancespeciale)) +
        ligne("NET A PAYER", "-", ariary(montants.netapayer), "total") +
        ligne("ARRONDI", "millier supérieur", ariary(montants.arrondi), "total");

      lignespatronales.innerHTML =
        ligne("CNaPS", taux(tauxcnapspatronal) + " sur " + ariary(montants.basecotisations), ariary(montants.cnapspatronale)) +
        ligne("FMFP", taux(tauxfmfp) + " sur " + ariary(montants.basecotisations), ariary(montants.fmfp)) +
        ligne("OSTIE", taux(tauxostiepatronal) + " sur " + ariary(montants.basecotisations), ariary(montants.ostiepatronale)) +
        ligne("Total charges patronales", "-", ariary(montants.totalchargespatronales), "total");

      document.querySelector("#net-lettres").textContent =
        "Net à payer du mois : \"" + nombreenlettres(montants.arrondi).replace(/^./, function (lettre) {
          return lettre.toUpperCase();
        }) + " Ariary\"";
    }

    function selectionnersalarie(matricule) {
      champs.matricule.value = matricule;
      calculerfiche();
    }

    function valeurpaiesalarie(salarie, cle) {
      return Math.max(0, Number(salarie[cle] ?? variablespaiepardefaut[cle] ?? 0) || 0);
    }

    function calculermontantssalarie(salarie = {}) {
      const salairebase = Math.max(0, Number(salarie.salairebase) || 0);
      const joursabsence = valeurpaiesalarie(salarie, "absence");
      const primes = valeurpaiesalarie(salarie, "primes");
      const heures130 = valeurpaiesalarie(salarie, "hs130");
      const heures150 = valeurpaiesalarie(salarie, "hs150");
      const heuresferies = valeurpaiesalarie(salarie, "feries");
      const heuresweekend = valeurpaiesalarie(salarie, "weekend");
      const personnes = Math.floor(valeurpaiesalarie(salarie, "personnesacharge"));
      const avance = valeurpaiesalarie(salarie, "avance");
      const avancespeciale = valeurpaiesalarie(salarie, "avancespeciale");
      const horaire = tauxhoraire(salairebase);
      const absence = montantabsence(salairebase, joursabsence);
      const hs130 = heures130 * horaire * tauxhs130;
      const hs150 = heures150 * horaire * tauxhs150;
      const feries = heuresferies * horaire * tauxferies;
      const weekend = heuresweekend * horaire * tauxweekend;
      const salairemois = Math.max(0, salairebase - absence);
      const totalheures = hs130 + hs150 + feries + weekend;
      const totalbrut = salairemois + primes + totalheures;
      const basecotisations = centaineinferieure(Math.min(totalbrut, plafondcotisations));
      const cnapsalarie = basecotisations * tauxcnapsalarie;
      const ostiesalarie = basecotisations * tauxostiesalarie;
      const montantimposable = Math.max(0, totalbrut - cnapsalarie - ostiesalarie);
      const irsatheorique = calculerirsa(montantimposable);
      const reductionimpot = personnes * reductionparpersonne;
      const irsa = totalbrut > 0 ? Math.max(irsaminimum, Math.floor(irsatheorique - reductionimpot)) : 0;
      const totaldeduire = irsa + avance + avancespeciale;
      const netexact = montantimposable - totaldeduire;
      const netapayer = Math.ceil(netexact);
      const arrondi = Math.ceil(netapayer / 1000) * 1000;
      const cnapspatronale = basecotisations * tauxcnapspatronal;
      const fmfp = basecotisations * tauxfmfp;
      const ostiepatronale = basecotisations * tauxostiepatronal;
      const totalchargespatronales = cnapspatronale + fmfp + ostiepatronale;

      return {
        salairebase,
        joursabsence,
        primes,
        heures130,
        heures150,
        heuresferies,
        heuresweekend,
        personnes,
        avance,
        avancespeciale,
        horaire,
        absence,
        hs130,
        hs150,
        feries,
        weekend,
        salairemois,
        totalheures,
        totalbrut,
        basecotisations,
        cnapsalarie,
        ostiesalarie,
        cnapspatronale,
        fmfp,
        ostiepatronale,
        totalchargespatronales,
        montantimposable,
        irsatheorique,
        reductionimpot,
        irsa,
        totaldeduire,
        netapayer,
        arrondi
      };
    }

    function echapperhtml(valeur) {
      return String(valeur ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function celluleetat(valeur, total = false) {
      return "<td>" + (total ? "<strong>" : "") + echapperhtml(valeur) + (total ? "</strong>" : "") + "</td>";
    }

    function ligneetat(cells, classe = "") {
      return "<tr class='" + classe + "'>" + cells.map(function (cellule) {
        return celluleetat(cellule, classe === "etat-total");
      }).join("") + "</tr>";
    }

    function moispaie() {
      const morceaux = texte("moispaie").split("-");

      if (morceaux.length !== 2) {
        return { nom: "", annee: "" };
      }

      return {
        nom: nomsmois[Number(morceaux[1]) - 1] || "",
        annee: morceaux[0]
      };
    }

    function ajoutertotal(totaux, montants) {
      for (const cle in totaux) {
        totaux[cle] = totaux[cle] + (montants[cle] || 0);
      }
    }

    function imprimeretatpaysage(titre) {
      const fenetre = window.open("", "_blank");

      if (!fenetre) {
        document.body.classList.add("impression-etat");
        window.print();
        return;
      }

      const baseurl = new URL(".", location.href).href;
      const feuillecss = new URL("css/fiche-paie.css", location.href).href;

      fenetre.document.open();
      fenetre.document.write(`
        <!doctype html>
        <html lang="fr">
          <head>
            <meta charset="utf-8">
            <base href="${baseurl}">
            <title>${echapperhtml(titre)}</title>
            <link rel="stylesheet" href="${feuillecss}">
            <style>
              @page { size: A4 landscape; margin: 6mm; }
              body { margin: 0; background: #ffffff; }
              .etat-paie { display: block; width: 285mm; min-height: 198mm; margin: 0; padding: 0; box-shadow: none; }
              @media print {
                body * { visibility: visible !important; }
                .etat-paie, .etat-paie * { visibility: visible !important; }
              }
            </style>
          </head>
          <body>${etatpaie.outerHTML}</body>
        </html>
      `);
      fenetre.document.close();

      fenetre.addEventListener("load", function () {
        fenetre.focus();
        fenetre.print();
        setTimeout(function () {
          fenetre.close();
        }, 500);
      });
    }

    function genereretatdepaiemois() {
      if (salaries.length === 0) {
        affichermessagebase("La base salariés est vide.");
        return;
      }

      const periode = moispaie();
      const totaux = {
        salairebase: 0,
        salairemois: 0,
        totalbrut: 0,
        cnapsalarie: 0,
        ostiesalarie: 0,
        cnapspatronale: 0,
        fmfp: 0,
        ostiepatronale: 0,
        montantimposable: 0,
        irsatheorique: 0,
        irsa: 0,
        totaldeduire: 0,
        netapayer: 0,
        arrondi: 0
      };

      const lignes = salaries.map(function (salarie) {
        const montants = calculermontantssalarie(salarie);
        ajoutertotal(totaux, montants);

        return ligneetat([
          salarie.matricule,
          salarie.nom + " " + salarie.prenoms,
          salarie.fonction,
          datefrancaise(salarie.dateembauche),
          ariary(montants.salairebase),
          ariary(montants.salairemois),
          ariary(montants.totalbrut),
          ariary(montants.cnapsalarie),
          ariary(montants.ostiesalarie),
          ariary(montants.cnapspatronale),
          ariary(montants.fmfp),
          ariary(montants.ostiepatronale),
          ariary(montants.montantimposable),
          ariary(montants.irsatheorique),
          ariary(montants.irsa),
          ariary(montants.totaldeduire),
          ariary(montants.netapayer),
          ariary(montants.arrondi)
        ]);
      });

      lignes.push(ligneetat([
        "TOTAL",
        "",
        "",
        "",
        ariary(totaux.salairebase),
        ariary(totaux.salairemois),
        ariary(totaux.totalbrut),
        ariary(totaux.cnapsalarie),
        ariary(totaux.ostiesalarie),
        ariary(totaux.cnapspatronale),
        ariary(totaux.fmfp),
        ariary(totaux.ostiepatronale),
        ariary(totaux.montantimposable),
        ariary(totaux.irsatheorique),
        ariary(totaux.irsa),
        ariary(totaux.totaldeduire),
        ariary(totaux.netapayer),
        ariary(totaux.arrondi)
      ], "etat-total"));

      etatpaie.innerHTML = `
        <div class="etat-entete">
          <div class="etat-marque">
            <img class="etat-logo" src="assets/falinwa-logo.png" alt="Falinwa Madagascar">
            <div class="etat-societe">
              <strong>FALINWA Madagascar</strong>
              NIF : 5 019 537 656<br>
              STAT : 70202 11 2026 0 10051<br>
              RCS : 2026B00056<br>
              CNAPS employeur : 9D5101 - OSTIE employeur : 014776
            </div>
          </div>
          <div class="etat-titre">
            <h2>Etat de paie</h2>
            <p>${echapperhtml(periode.nom + " " + periode.annee)}</p>
          </div>
        </div>
        <table class="etat-table">
          <colgroup>
            <col style="width: 4%">
            <col style="width: 11%">
            <col style="width: 12%">
            <col style="width: 5%">
            <col style="width: 5.6%">
            <col style="width: 5.6%">
            <col style="width: 5.6%">
            <col style="width: 4.7%">
            <col style="width: 4.7%">
            <col style="width: 5.2%">
            <col style="width: 4.7%">
            <col style="width: 5.2%">
            <col style="width: 5.8%">
            <col style="width: 5.8%">
            <col style="width: 5.4%">
            <col style="width: 5.4%">
            <col style="width: 5.6%">
            <col style="width: 5.5%">
          </colgroup>
          <thead>
            <tr>
              <th>N° Mle</th>
              <th>Nom et prénoms</th>
              <th>Fonction</th>
              <th>Embauche</th>
              <th>Salaire de base</th>
              <th>Salaire mois</th>
              <th>Salaire brut</th>
              <th>CNaPS 1%</th>
              <th>OSTIE 1%</th>
              <th>CNaPS 13%</th>
              <th>FMFP 1%</th>
              <th>OSTIE 5%</th>
              <th>Salaire imposable</th>
              <th>IRSA correspondant</th>
              <th>IRSA</th>
              <th>Total à déduire</th>
              <th>Net à payer</th>
              <th>Arrondi</th>
            </tr>
          </thead>
          <tbody>${lignes.join("")}</tbody>
        </table>
        <div class="etat-recap">
          <div class="recap-carte">
            <h3>Charges patronales</h3>
            <div class="recap-ligne"><span>CNaPS 13%</span><strong>${ariary(totaux.cnapspatronale)}</strong></div>
            <div class="recap-ligne"><span>FMFP 1%</span><strong>${ariary(totaux.fmfp)}</strong></div>
            <div class="recap-ligne"><span>OSTIE 5%</span><strong>${ariary(totaux.ostiepatronale)}</strong></div>
            <div class="recap-ligne"><span>Total</span><strong>${ariary(totaux.cnapspatronale + totaux.fmfp + totaux.ostiepatronale)}</strong></div>
          </div>
          <div class="recap-carte">
            <h3>Charges salariales</h3>
            <div class="recap-ligne"><span>CNaPS 1%</span><strong>${ariary(totaux.cnapsalarie)}</strong></div>
            <div class="recap-ligne"><span>OSTIE 1%</span><strong>${ariary(totaux.ostiesalarie)}</strong></div>
            <div class="recap-ligne"><span>IRSA</span><strong>${ariary(totaux.irsa)}</strong></div>
            <div class="recap-ligne"><span>Total retenues</span><strong>${ariary(totaux.cnapsalarie + totaux.ostiesalarie + totaux.totaldeduire)}</strong></div>
          </div>
          <div class="recap-carte">
            <h3>Récapitulation</h3>
            <div class="recap-ligne"><span>Salaire brut</span><strong>${ariary(totaux.totalbrut)}</strong></div>
            <div class="recap-ligne"><span>Salaire imposable</span><strong>${ariary(totaux.montantimposable)}</strong></div>
            <div class="recap-ligne"><span>Salaire net</span><strong>${ariary(totaux.netapayer)}</strong></div>
            <div class="recap-ligne"><span>Arrondi à payer</span><strong>${ariary(totaux.arrondi)}</strong></div>
          </div>
        </div>
      `;

      const titrepage = document.title;
      document.title = "Etat de paie - " + periode.nom + " " + periode.annee;
      imprimeretatpaysage(document.title);

      setTimeout(function () {
        document.body.classList.remove("impression-etat");
        etatpaie.innerHTML = "";
        document.title = titrepage;
      }, 1000);
    }

    function genererfichespourtous() {
      if (salaries.length === 0) {
        affichermessagebase("La base salariés est vide.");
        return;
      }

      const matriculeinitial = texte("matricule");
      lotpaie.innerHTML = "";

      for (const salarie of salaries) {
        selectionnersalarie(salarie.matricule);
        lotpaie.appendChild(document.querySelector("#apercupaie").cloneNode(true));
      }

      document.body.classList.add("impression-multiple");
      const titrepage = document.title;
      document.title = "Fiches de paie - " + periodecomplete();
      window.print();

      setTimeout(function () {
        document.body.classList.remove("impression-multiple");
        lotpaie.innerHTML = "";
        document.title = titrepage;
        selectionnersalarie(matriculeinitial);
      }, 1000);
    }

    champs.moispaie.addEventListener("change", calculerfiche);

    champs.matricule.addEventListener("change", function () {
      calculerfiche();
      affichermessagebase("");
    });

    telechargermodele.addEventListener("click", telechargermodelesalaries);
    importerbase.addEventListener("click", importerfichierbase);
    generertoutesfiches.addEventListener("click", genererfichespourtous);
    genereretatpaie.addEventListener("click", genereretatdepaiemois);

    preparerlisteemployes();
    calculerfiche();
    affichermessagebase("Importe un fichier Excel ou CSV pour charger la base salariés.");
