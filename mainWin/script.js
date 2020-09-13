const { ipcRenderer, clipboard } = require('electron');
const output = document.getElementById('output');
var discarded = []
var sorted = false;
var selectedPass;

ipcRenderer.on('displayPasswords',function(e,passwords){
    var passwordsList="";
    passwords.forEach(function(pass,i){
        let passAndStatus="";

        if(pass[1]=='usado'){
            passAndStatus=pass[0]+" ~ Usada recientemente"
        }
        else if(pass[1]=='usable' || pass[1]=='nuevo'){
            passAndStatus=pass[0]+" ~ Disponible para usar"
        }

        if(i==0){
            passwordsList+=passAndStatus;
        }else{
            passwordsList+='\n'+passAndStatus;
        }
    })
    alert(passwordsList);
})

function sortPass(reSort){
    if(sorted==reSort){
        var pass = ipcRenderer.sendSync('sort',discarded)
        if(pass[0]!=undefined){
            selectedPass=pass[0];
            output.innerHTML=selectedPass;
            discarded.push(pass[1]);
            sorted=true;
        }else{
            let thisNeverHappened = confirm("No quedan más opciones\nHaga click en Aceptar para volver a sortear las mismas opciones");
            if(thisNeverHappened){
                discarded = [];
                sorted = false;
                selectedPass=null;
                output.innerHTML=null;
            }
        }
    }else if (reSort==false && sorted!=null){
        alert("Use Volver a Sortear para sacar una opción distinta")
    }
}

function pullPass(){
    if(selectedPass.length>0){
        if(confirm("¿Usar "+selectedPass+"?")){
            let ipcResponse = ipcRenderer.sendSync('changeToUsed',selectedPass);
            output.style.backgroundImage="linear-gradient(rgba(0,0,0,0), rgba(255,100,0,1) 80%)"
            if(confirm(selectedPass+" fue marcada como usada. Seleccione Aceptar para copiarla al portapapeles")){
                clipboard.writeText(selectedPass)
            }
            document.querySelectorAll('button').forEach(function(button){
                button.setAttribute('disabled','true');
            })
            if(ipcResponse==false){
                let setAllToUsable = confirm('No hay más opciones sin usar. Haga click en Aceptar para configurar todas las contraseñas como "Usables"');
                if(setAllToUsable){
                    ipcRenderer.sendSync('setAllToUsable',null);
                }
            }
        }
    }
}

