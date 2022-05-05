import {sessionsList} from './sessions.mjs'
var sessionsDB;
function expandSection(id){
    var el = document.querySelector("#" +id + " > div");
    console.log(el.classList);
    if(el.classList.contains("expanded")){
        el.style.visibility = "hidden";
        el.style.opacity = "0";
        el.classList.add("collapsed");
        el.classList.remove("expanded");

    }else{
        el.style.visibility = "visible";
        el.style.opacity = "1";
        el.classList.add("expanded");
        el.classList.remove("collapsed");
    }
}

function toggleBg(event){
    if(event.target.checked){
        document.querySelector(".bg").style.display = "none";
        document.querySelector("body").style.background = "radial-gradient(circle, rgba(140,177,231,1) 0%, rgba(183,113,226,1) 77%, rgba(251,12,218,1) 100%)"
    }else{
        document.querySelector(".bg").style.display = "inline-block";
        document.querySelector("body").style.background = "rgb(248, 118, 237)"
    }
}  


// function toggleTerminal(event){
//     if(event.target.classList.contains("mini")){
//         document.querySelector("#terminal").style.display = "none";
//     }else{
//         document.querySelector("#terminal").style.display = "block";
//     }
// }  

function updateMainContainer(event){
    let page = event.target.id;
    let prev = document.querySelector("#containerBody .selected");
    if(prev){
        prev.classList.add("hidden");
        prev.classList.remove("selected");
    }
    document.querySelector("#misc .selected").classList.remove("selected");
    event.target.classList.add("selected");
    let cont;
    if(page == "ts"){
        document.getElementById("blobs").style.display = "none";
        cont = document.getElementById("tsContainer");
        document.querySelector("#containerBody h2").innerHTML = ""
    }else if(page == "til"){
        document.getElementById("blobs").style.display = "none";
        cont = document.getElementById("tilContainer");
        document.querySelector("#containerBody h2").innerHTML = "today i'm learning"
    } else{
        document.getElementById("blobs").style.display = "block";
        if(page == "welcome"){
            cont = document.getElementById("introContainer");
            document.querySelector("#containerBody h2").innerHTML = "welcome to terminal sessions"
        }else if(page == "abt"){
            cont = document.getElementById("abtContainer");
            document.querySelector("#containerBody h2").innerHTML = "some more things about me"
        }else if(page == "digital_garden"){
            cont = document.getElementById("gardenContainer");
            document.querySelector("#containerBody h2").innerHTML = "more on digital gardens"
        }
    }
    
    if(cont){
        cont.classList.remove("hidden");
        cont.classList.add("selected");
    }
}

function viewSession(event){
    let parent = event.target.parentElement; //user may click on title or symbol
    if(parent.classList.contains("sessionMini")){
        let title = parent.querySelector(".sessionTitle").innerHTML;
        let session =  sessionsDB.find('sessions', {title: title});
        if(session.length > 0){
            document.querySelector("#sessionContainer h2").innerHTML = session[0].title;
            document.getElementById("session").innerHTML = session[0].text;
            let sessCont = document.getElementById("sessionContainer");
            let mainCont = document.getElementById("mainContainer");
            sessCont.classList.remove("hidden");
            mainCont.classList.add("hidden");
        }
    }    
}

function hideSession(event){
    let sessCont = document.getElementById("sessionContainer");
    let mainCont = document.getElementById("mainContainer");
    sessCont.classList.add("hidden");
    mainCont.classList.remove("hidden");
}

window.addEventListener('load', function(){
    sessionsDB = new localdb('sessionsDB');
    sessionsDB.dropTable('sessions');
    if(!sessionsDB.tableExists('sessions')){
        sessionsDB.createTable('sessions');
        for(let i = 0; i < sessionsList.length; i ++){
            let session = sessionsList[i];
            sessionsDB.insert('sessions', session);
        }
    }
    let introContainer = document.getElementById("introContainer");
    introContainer.classList.remove("hidden");    
    document.getElementById("bgCtrl").addEventListener('click',toggleBg);
    let miscItems = document.querySelectorAll("#misc img");
    miscItems.forEach(item => {
        item.addEventListener('click', (e)=>{
            if(e.target === e.currentTarget){
                updateMainContainer(e);
            }
        })
    });
    let sessions = Array.from(document.querySelectorAll(".sessionMini"));
    sessions.forEach(session => {
        session.addEventListener('click', viewSession);
    });
    document.querySelector("#sessionHeader button").addEventListener('click', hideSession);
});