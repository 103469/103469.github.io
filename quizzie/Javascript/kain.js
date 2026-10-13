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
    foutmelding.style.color = ""; // voor de loop als hij gaat lopen weer leeg veld heeft

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
  "Vraag 1:Wat voor vitamine komt niet voor in een appel?", 
  "Vraag 2: Wat is gezond?", 
  "Vraag 3: Wat is niet gezond om te drinken?", 
  "Vraag 4: Welke van deze onderstaande vruchten is het gezondst?", 
  "Vraag 5: Welke hieronder is geen groente?", 
  "Vraag 6: Welk dierlijk product is gezond?",
  "Vraag 7: Welke vitamine zorgt voor beter nacht zigt",//open
  "Vraag 8: Is water giftig als je er te veel drinkt of te snel drinkt?",//open
  "Vraag 9: Wat zorgt vitamine d uit je eten voor in je lichaam niet?",
  "Vraag 10: Is het gezond om fruit met de schil te eten",
  "Vraag 11: Kan eten giftig zijn?",//open
  "Vraag 12: Alle vitaminen zijn goed voor je maar te veel is niet goed",
  "Vraag 13: Welke vitamine is het belangrijkst/het beste?",// open
  "Vraag 14: Welke vitamine geeft de zon",//open
  "Vraag 15: Kan cafeïne gezond zijn?",


]; // ab c d vragen
let antwoordTeksten = [
  ["A. Vitamine C", "B. Vitamine B", "C. Vitamine K", "D. Vitamine D"],
  ["A. Een dubbele cheeseburger van de mac","B. Een groente salade","C. Een pizza met extra vlees","D. Een lekkere kroket of friekandel met patat/friet en ketchup/mayo"],
  ["A. Thee","B. Water","C. Koffie","D. Energy drank"],
  ["A. Kiwi","B. Peer","C. Mango","D. Rode bessen"],
  ["A. Tomaat", "B. Komkommer","C. Aardappelen", "D. Paprika"],
  ["A. Knakworst","B. Kipnuggets","C. Ei", "D. Metworst"],
  [],
  [],
  ["A. Betere weerstand tegen ziektes","B. Zorgt voor betere botten en gebit","C. Het is goed voor je in het algemeen", "D. Zorgt voor betere nacht"],
  ["A. Waar","B. Niet waar"],
  [],
  ["A. Waar","B. Niet waar"],
  [],
  [],
  ["A. Waar","B. Niet waar"],


];

let antwoorden = [4, 2, 4, 1, 2, 3, "vitamine a", "ja", 4, 1, "ja", 1, "vitamine d3", "vitamine d", 1]; // antwoorden

let uitlegAntwoorden = [
  "Vitamine D komt niet voor in een appel omdat fruit, groenten, noten en zaden van nature vrijwel geen vitamine D bevatten.",
  "De andere bevatten heel veel vetten dat ongezond is en veel suikers.",
  "door de combinatie van extreem hoge hoeveelheden suiker, andere stimulerende middelen (zoals taurine) en het feit dat het vaak koud en snel wordt gedronken.",
  "De kiwi wordt vaak als een van de gezondste fruitsoorten beschouwd, vooral in vergelijking met peer, mango en rode bessen, vanwege zijn extreem hoge voedingsdichtheid (veel voedingsstoffen in verhouding tot het aantal calorieën).",
  "Een komkommer is plantkundig gezien geen groente, maar een vrucht. Dit komt doordat de komkommer groeit uit een bloem en zaden bevat. Vanwege de frisse, hartige smaak en het gebruik in de keuken (rauw in salades) beschouwen we het echter als een vruchtgroente maar botanisch (wetenschappelijk) is het een vrucht",
  "Eieren zijn zeer gezond omdat ze worden beschouwd als een «»voedingsbommetje«» met hoogwaardige eiwitten, essentiële vitaminen (A, D, B2, B12) en mineralen (ijzer, zink, selenium).",
  "Vitamine A is de belangrijkste vitamine voor een goed nachtzicht.",
  "Water is giftig als je er te veel of te snel van drinkt omdat het de fijne balans van elektrolyten (zouten) in je bloed verstoort. Dit fenomeen staat bekend als watervergiftiging of hyponatriëmie.",
  "Vitamine D zorgt niet voor een beter nachtzicht omdat het niet de vitamine is die direct betrokken is bij het visuele proces in het donker; die rol is weggelegd voor vitamine A.",
  "Fruit met schil eten is gezond omdat de schil een concentratie van voedingsstoffen bevat, zoals extra vitaminen (A, E, C), mineralen, vezels en antioxidanten. Het eten van de schil bevordert de spijsvertering, zorgt voor een langer verzadigd gevoel en vermindert voedselverspilling. Het is echter wel belangrijk om fruit grondig te wassen om pesticiden te verwijderen.",
  "Eten kan giftig zijn door een combinatie van biologische besmettingen (bacteriën, schimmels), natuurlijke giffen in producten zelf, of door chemische verontreiniging. Dit kan leiden tot voedselinfecties of vergiftigingen.",
  "Ja, alle 13 bekende vitaminen zijn essentieel voor je gezondheid, maar te veel (vooral via supplementen) kan schadelijk zijn",
  "Vitamine D3 (cholecalciferol) wordt vaak beschouwd als een van de belangrijkste vitamines omdat het cruciaal is voor fundamentele lichaamsfuncties en uniek is in zijn werking vergeleken met andere vitamines. Het fungeert eigenlijk meer als een hormoon dan als een gewone vitamine, met receptoren in bijna elke cel van het lichaam.",
  "De zon is de belangrijkste bron van vitamine D, die je huid aanmaakt onder invloed van UV-B straling.",
  "Ja, cafeïne is bij matig gebruik (tot 400 mg per dag, ca. 4-5 kopjes koffie) veilig en kan gezondheidsvoordelen bieden, zoals een verbeterde alertheid en concentratie. Het bevat antioxidanten en kan beschermen tegen bepaalde chronische ziekten. Te veel cafeïne kan echter leiden tot slaapproblemen, nervositeit en hartkloppingen.",
];
let score = 0; // score telling
let welkeVraag = 0; // i om meerdere vragen te hebben.
let wachten = false;

let quiz = document.getElementById("quiz");
let resultaat = document.getElementById("resultaat");

quiz.innerText = vragen[welkeVraag];

// Tekst toevoegen aan de knoppen
for (let i = 0; i < mogelijkheden.length; i++) {
	if (typeof(antwoordTeksten[welkeVraag][i]) != "undefined" || antwoordTeksten[welkeVraag][i] !== ""){
  		mogelijkheden[i].innerText = antwoordTeksten[welkeVraag][i];
	} else {
		mogelijkheden[i].style.display = "none";
	}
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
        "antwoord-vervaagd",
      );
    });

    if (welkeVraag < vragen.length) {
      //
      quiz.innerText = vragen[welkeVraag];

      for (let i = 0; i < mogelijkheden.length; i++) {
        const antwoord = antwoordTeksten[welkeVraag][i];
        const button = mogelijkheden[i];
        console.log(antwoord);
        if (typeof(antwoord) != "undefined" ) {
          button.innerText = antwoord;
          button.style.display = 'block';
        } else {
          button.style.display = 'none';
        }
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
          origin: { y: 0.6 },
        });

        resultaat.style.display = "block";
        resultaat.style.color = "black"; //troffe zichtbaar
        knop.style.display = "none";
        fieldset.style.display = "none";
        resultaat.innerText =
          "Score van " + naam.value + ": " + score + " / " + vragen.length;
        if (score > 12) {
          //in css op hidden met display none
          //goud
          goud.style.display = "block";
        }
        if (score > 8 && score <= 12) {
          //zilver
          zilver.style.display = "block";
        }
        if (score <= 8 && score > 5) {
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
        "antwoord-vervaagd",
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
