let naamin = document.getElementById("naamin");
let startknop = document.getElementById("start");
let foutmelding = document.getElementById("foutmelding");
let form = document.getElementById("form");
let label = document.getElementById("label");
let mogelijkheden = document.querySelectorAll(".antwoord-button");
let openvraag = document.getElementById("openvraag");

if (startknop) {
  startknop.addEventListener("click", function () {
    foutmelding.innerText = "";
    foutmelding.style.color = "";// voor de loop als hij gaat lopen weer leeg veld heeft

    let naam = document.getElementById("naam");
    if (!naam.value) {
      //als naam fout is
      foutmelding.innerText = "Foute invoer. Vul je naam in";
      foutmelding.style.color = "red";
      return; //hij stopt en weer overnieuw
    }
    naamin.innerText = naam.value; // dit kan ook in een div en dan op display none
    form.style.display = "block";
    naam.style.display = "none";
    startknop.style.display = "none";
    label.style.display = "none";
    openvraag.style.display = "none";
    
  });
}

let vragen = [
  "Vraag 1: Waarom worden spieren eigenlijk sterker van krachttraining?",
  "Vraag 2: Wat zegt een lage rusthartslag over iemands conditie?",
  "Vraag 3: Wat is de belangrijkste reden om op te warmen voor het sporten?", //open
  "Vraag 4: Wat gebeurt er als je jezelf structureel overtraint?",
  "Vraag 5: Is sporten goed voor je mentale gezondheid?", //open
  "Vraag 6: Wat maakt je lichaam aan als je zo intensief traint dat je geen zuurstof genoeg meer kunt aanvoeren?", //open
  "Vraag 7: Wat merk je na langere tijd regelmatig duurtraining te hebben gedaan?",
  "Vraag 8: Waarom is een rustdag na zware training eigenlijk zo belangrijk?",
  "Vraag 9: Wat kan er gebeuren als je steeds met een slechte techniek sport?",
  "Vraag 10: Wat heeft je lichaam meer nodig zodra je gaat bewegen, waardoor je hart sneller gaat kloppen?", //open
  "Vraag 11: Wat gebeurt er met spieren wanneer je regelmatig weerstandstraining doet?",
  "Vraag 12: Welk macronutriënt is het meest belangrijk voor spierherstel?",
  "Vraag 13: Hoeveel liter water wordt per dag aanbevolen bij intensief sporten?", //open
  "Vraag 14: Wat is de naam van de stof die vrijkomt bij anaerobe inspanning?",
  "Vraag 15: Welk type training verbetert vooral je uithoudingsvermogen?"
];
 
let antwoordTeksten = [
  ["A. Ze groeien direct tijdens het sporten", "B. Ze herstellen en worden sterker na de training", "C. Ze wennen aan de pijn en geven op", "D. Er gebeurt eigenlijk niets bijzonders"],
  ["A. Je hart pompt efficiënter en heeft minder slagen nodig", "B. Je bent waarschijnlijk te weinig actief", "C. Je bloeddruk is te hoog", "D. Je wordt sneller moe dan normaal"],
  [], //open
  ["A. Je herstelt juist sneller dan normaal", "B. Je presteert beter omdat je lichaam went", "C. Je raakt vermoeid en presteert steeds slechter", "D. Je krijgt meer energie dan voorheen"],
  [], //open
  [], //open
  ["A. Je spieren worden juist zwakker", "B. Het heeft weinig effect op de lange termijn", "C. Je kunt langer doorsporten zonder buiten adem te raken", "D. Je uithoudingsvermogen neemt af"],
  ["A. Om te voorkomen dat spieren te groot worden", "B. Omdat sporten op zich al slecht voor je is", "C. Je hebt gewoon geen reden nodig", "D. Je lichaam heeft tijd nodig om te herstellen en sterker te worden"],
  ["A. Je herstelt juist sneller", "B. Je raakt eerder geblesseerd door verkeerde belasting", "C. Je hebt meer energie tijdens het sporten", "D. Je presteert automatisch beter"],
  [], //open
  ["A. Het heeft geen effect op spiermassa", "B. Spieren worden kleiner maar sterker", "C. Spiercellen vergroten zich door weerstandstraining", "D. Spieren verdwijnen bij te veel training"],
  ["A. Koolhydraten", "B. Vetten", "C. Vitamines", "D. Eiwitten"],
  [], //open
  ["A. Melkzuur", "B. Adrenaline", "C. Insuline", "D. Dopamine"],
  ["A. Krachttraining", "B. Yoga", "C. Cardio", "D. Stretching"]
];
 
// Antwoorden zijn 1-gebaseerd (1=A, 2=B, 3=C, 4=D) — open vragen hebben een tekstantwoord
let antwoorden = [2, 1, "blessurepreventie", 3, "ja", "melkzuur", 3, 4, 2, "zuurstof", 3, 4, "2 liter", 1, 3];
 
let uitlegAntwoorden = [
  "Tijdens training ontstaan kleine scheurtjes in je spieren. Tijdens rust herstellen die scheurtjes en worden de spieren sterker — dit heet supercompensatie.",
  "Een lage rusthartslag betekent dat je hart krachtig genoeg is om met minder slagen toch genoeg bloed rond te pompen. Dat is een teken van een goede conditie.",
  "Door op te warmen stijgt je lichaamstemperatuur, komen je spieren en gewrichten op gang en wordt je doorbloeding beter. Zo verklein je de kans op blessures aanzienlijk.",//open
  "Bij structureel overtrainen geef je je lichaam geen tijd om te herstellen. Je prestaties dalen, je bent voortdurend moe en de kans op blessures neemt sterk toe.",
  "Ja! Tijdens het sporten maakt je lichaam endorfines aan. Die zorgen voor een beter humeur en minder stress.",//open
  "Bij intensieve inspanning kan je lichaam niet snel genoeg zuurstof aanvoeren. Het schakelt dan over op anaerobe energieproductie, waarbij melkzuur ontstaat.",//open
  "Duurtraining vergroot je zuurstofopnamecapaciteit (VO₂max). Je hart en longen werken efficiënter, waardoor je langer en makkelijker kunt bewegen.",
  "Spiergroei en herstel vinden niet tijdens de training plaats, maar erna. Zonder rust kun je de voordelen van training niet benutten.",
  "Een slechte techniek zorgt voor een ongelijke of te grote belasting op spieren en gewrichten. Na verloop van tijd leidt dat bijna altijd tot blessures.",
  "Bewegende spieren hebben meer zuurstof en glucose nodig. Je hart klopt sneller om die extra vraag bij te houden en voldoende bloed naar de spieren te pompen.",//open
  "Hypertrofie is de vergroting van spiercellen als reactie op weerstandstraining. Spiervezels herstellen en worden dikker.",
  "Eiwitten leveren de aminozuren die nodig zijn om beschadigde spiervezels te repareren en nieuwe spiermassa op te bouwen.",
  "Bij intensieve training verlies je veel vocht via zweet. Voldoende hydratatie verbetert prestaties en versnelt herstel.", //open
  "Bij anaerobe inspanning kan het lichaam niet genoeg zuurstof aanvoeren en wordt melkzuur aangemaakt als bijproduct van energieproductie.",
  "Aerobe training zoals hardlopen of fietsen traint het hart en de longen, waardoor je lichaam efficiënter zuurstof gebruikt en je conditie verbetert."
];
let score = 0; // score telling
let welkeVraag = 0; // i om meerdere vragen te hebben.
let wachten = false;

let quiz = document.getElementById("quiz");
let resultaat = document.getElementById("resultaat");

quiz.innerText = vragen[welkeVraag];
for (let i = 0; i < mogelijkheden.length; i++) {
  mogelijkheden[i].innerText = antwoordTeksten[welkeVraag][i];
}
form.addEventListener("submit", function (e) {
  e.preventDefault(); // herlaad niet de pagina anders zou alles leeg zijn

  let gekozen = document.querySelector('input[name="antwoord"]:checked');
  let opties = document.querySelectorAll('input[name="antwoord"]'); // checken via name
  let fieldset = document.getElementById("fieldset");

  if (typeof antwoorden[welkeVraag] == "string") {
    if (openvraag.value == "" || !gekozen) {
      resultaat.innerText = "kies een antwoord!";
      return;
    }
  } else {
    if (!gekozen) {
      resultaat.innerText = "kies een antwoord!";
      return;
    }
  }

  if (wachten) {
    welkeVraag++;
    resultaat.style.color = "black";
    //quinten zijn code
    mogelijkheden.forEach((button) => {
      button.classList.remove(
        "antwoord-goed",
        "antwoord-fout",
        "antwoord-vervaagd"
      );
    });


    if (welkeVraag < vragen.length) {
      //
      quiz.innerText = vragen[welkeVraag];

      for (let i = 0; i < mogelijkheden.length; i++) {
        mogelijkheden[i].innerText = antwoordTeksten[welkeVraag][i];
      }

      if (typeof antwoorden[welkeVraag] == "string") {
        // wweer kijken of het een string is
        openvraag.value = ""; // de openvraag is leeg
        fieldset.style.display = "none"; // staat op uit je kan je antwoord niet invullen
        openvraag.style.display = "block"; // staat aan
        knop.innerText = "Antwoord";
        resultaat.innerText = "";
      } else {
        gekozen.checked = false; // kijkt en maakt de radio knoppen niet geselecteerd dan kan je hem invullen
        openvraag.style.display = "none"; //hier is het omgedraait
        fieldset.style.display = "block";
        knop.innerText = "Antwoord";
        resultaat.innerText = "";
      }
    } else {
      const loader = document.getElementById("loader1");
      loader.style.display = "block";
      let goud = document.getElementById("goud");
      let zilver = document.getElementById("zilver");
      let brons = document.getElementById("brons");
      let terug = document.getElementById("knopterug");
      // 5 seconden (5000 milliseconden)
      quiz.style.display = "none";
      resultaat.style.display = "none";
      fieldset.style.display = "none";
      knop.style.display = "none";
      setTimeout(() => {
      loader.style.display = "none";
      quiz.style.display = "block";
      quiz.innerText = "Hoera!🎈 Je hebt de quiz voltooid!🎉";
      terug.style.display = "block";

        confetti({
        particleCount: 1000,
        spread: 700,
        origin: { y: 0.6 }
        });


      resultaat.style.display = "block";
      resultaat.style.color = "black"; //troffe zichtbaar
      knop.style.display = "none";
      fieldset.style.display = "none";
      resultaat.innerText = "Score van " + naam.value + ": " + score + " / " + vragen.length;
      if(score > 12 ){ //in css op hidden met display none
//goud
        goud.style.display = "block";
      } if(score > 8 && score <= 12){
//zilver
        zilver.style.display = "block";
      } if(score <= 8 && score > 5){
//brons
        brons.style.display = "block";
      }
      // hier zou naamin.value bij kunnen
      }, 5000);

      

      // hier komt nog iets ter afsluiting van de quiz
    }
    // knop.innerText = "Antwoord"
    // resultaat.innerText = "";

    wachten = false;
    return;
  }

  if (typeof antwoorden[welkeVraag] == "string") {
    // kijk of het antwoord een string is
    if (openvraag.value.toLowerCase().trim() === antwoorden[welkeVraag]) {
      // als de openvraag klopt gaat de scoren om hoog met 1
      score++;
      resultaat.innerText = "Goed antwoord! " + uitlegAntwoorden[welkeVraag];
      resultaat.style.color = "green";
    } else {
      resultaat.innerText =
        "Fout antwoord! Het juiste antwoord is: " +
        antwoorden[welkeVraag] +
        ". " +
        uitlegAntwoorden[welkeVraag];
      resultaat.style.color = "red";
    }
  } else {
    if (Number(gekozen.value) === antwoorden[welkeVraag]) {
      // bij een value nummer die je gekozen hebt en die is goed weer een score erbij
      score++;
      resultaat.innerText = "Goed antwoord! " + uitlegAntwoorden[welkeVraag];
      resultaat.style.color = "green";
    } else {
      resultaat.innerText =
        "Fout antwoord! Het juiste antwoord is: " +
        antwoordTeksten[welkeVraag][antwoorden[welkeVraag] - 1] +
        ". " +
        uitlegAntwoorden[welkeVraag];
      resultaat.style.color = "red";
    }
  }
  knop.innerText = "Volgende";
  wachten = true;

  // Kleur buttons quinten
  if (typeof antwoorden[welkeVraag] !== "string") {
    let juisteIndex = antwoorden[welkeVraag] - 1;
    let gekozenIndex = Number(gekozen.value) - 1;

    mogelijkheden.forEach((button, index) => {
      button.classList.remove(
        "antwoord-goed",
        "antwoord-fout",
        "antwoord-vervaagd"
      );

      if (index === juisteIndex) {
        button.classList.add("antwoord-goed");
      } else if (index === gekozenIndex) {
        button.classList.add("antwoord-fout");
      } else {
        button.classList.add("antwoord-vervaagd");
      }
    });
  }
});

// const vraag1 = [
//   {
//     vraag:"antwoord",
//     antwoord:[
//   'antwoord1',
//   'antwoord2',
//   'antwoord3',
//   'antwoord4'
// ],
// correct: [0]
// }]

  



