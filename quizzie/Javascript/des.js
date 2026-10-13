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
  "Vraag 1:Wat is een drug?", 
  "Vraag 2: Welke van deze middelen is een stimulerende drug?", 
  "Vraag 3: Wat kan een risico zijn van drugsgebruik op jonge leeftijd?", 
  "Vraag 4: Welke drug valt onder verdovende middelen?", 
  "Vraag 5: Wat betekent verslaving?", 
  "Vraag 6: Wat kan een effect zijn van XTC?",
  "Vraag 7: Welke drug is het meest veilig?",//open
  "Vraag 8: Weet de wetenschap wat de meest schadelijkste drugs is?",//open
  "Vraag 9: Wat is verstandig als iemand drugs aanbiedt en jij twijfelt?",
  "Vraag 10: Waarom is drugsgebruik riskanter voor jongeren?",
  "Vraag 11: Welke stof in alcohol zorgt voor het effect?",//open
  "Vraag 12: Wat is een hallucinerende drug?",
  "Vraag 13: Welk risico hebben drugs wel en paracetamol meestal niet?",// open
  "Vraag 14: Kan een paracetamol rust geven?",//open
  "Vraag 15: Wat kan een gevolg zijn van te veel alcohol drinken?",


]; // ab c d vragen

let antwoordTeksten = [
  ["A. Alleen illegale middelen", "B. Een stof die je lichaam of geest verandert", "C. Alleen medicijnen", "D. Alleen alcohol"],
  ["A. Cannabis","B. Alcohol","C. XTC","D. Slaappillen"],
  ["A. Sneller leren","B. Betere concentratie","C. Verstoring van hersenontwikkeling","D. Grotere spieren"],
  ["A. Cocaïne","B. Cannabis","C. LSD","D. XTC"],
  ["A. Dat je iets leuk vindt", "B. Dat je niet meer zonder kunt en controle verliest","C. Dat je het één keer hebt geprobeerd", "D. Dat je alleen in het weekend gebruikt"],
  ["A. Meer energie en verbondenheid voelen ","B. Slaperigheid","C. Slechter zicht permanent", "D. Geen effect"],
  [],
  [],
  ["A. Altijd ja zeggen","B. Meedoen om erbij te horen","C. Stiekem nemen", "D. Je eigen keuze maken en nee durven zeggen"],
  ["A. Omdat het duur is","B. Omdat hun lichaam kleiner is","C. Omdat het verboden is","D. Omdat hun hersenen nog in ontwikkeling zijn"],
  [],
  ["A. Een drug die je dingen anders laat zien of horen","B. Een drug die je sterker maakt","C. Een drug die je slaperig maakt","D. Een drug zonder effect"],
  [],
  [],
  ["A. Betere reflexen","B. Minder controle en black-out","C. Sneller denken","D. Betere coördinatie"]

];

let antwoorden = [2, 3, 3, 2, 2, 1, "koffie", "nee", 4, 4, "ethanol", 1, "verslaving", "ja", 2]; // antwoorden

let uitlegAntwoorden = [
  "Drugs zijn alle stoffen die invloed hebben op hoe je je voelt, denkt of gedraagt — dus niet alleen illegale middelen.",
  "XTC stimuleert je lichaam en hersenen, waardoor je je energieker en blijer kunt voelen.",
  "Je hersenen zijn nog in ontwikkeling. Drugs kunnen die ontwikkeling verstoren en invloed hebben op geheugen en emoties.",
  "Cannabis werkt verdovend en kan je rustig, sloom of ontspannen maken.",
  "Bij verslaving blijf je gebruiken, ook als het slecht voor je is, en wordt stoppen moeilijk.",
  "XTC kan zorgen voor een energiek gevoel en dat je je meer verbonden voelt met anderen, maar het kan ook gevaarlijk zijn.",
  "Koffie is het minst schadelijk van alle drugs",
  "Helaas is dat lastig te verklaren zegt de wetenschap omdat alle drugs wel iets heeft waardoor drugs op een lijn komen te staan",
  "Het is belangrijk dat je zelf bepaalt wat je doet en je niet onder druk laat zetten.",
  "De hersenen van jongeren zijn gevoeliger voor schade door drugs",
  "Ethanol is de werkzame stof die invloed heeft op je hersenen en gedrag.",
  "Hallucinogene drugs veranderen je waarneming, waardoor je dingen kunt zien of horen die er niet zijn.",
  "Drugs kunnen het beloningssysteem beïnvloeden, waardoor je afhankelijk kunt worden. Paracetamol doet dit niet.",
  "Paracetamol werkt in de hersenen en remt pijnsignalen. Wanneer pijn (zoals hoofdpijn of spierpijn) afneemt, voelt je lichaam zich automatisch rustiger en meer ontspannen.",
  "Alcohol vertraagt je hersenen, waardoor je controle verliest en soms dingen niet meer herinnert.",
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

  



