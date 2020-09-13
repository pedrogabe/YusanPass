const {ipcRenderer} = require('electron')
var input = document.getElementById('input');
document.querySelector('button').addEventListener('click',add)

input.focus()

function add(){
    var newPass = input.value;
    if(newPass.length>0){
        var checkingReturn = ipcRenderer.sendSync('checkPass',newPass);
        if(checkingReturn[0]=="alreadyExists"){
            alert("Ya está anotado "+checkingReturn[1]);
        }else if(checkingReturn[0]=="added"){
            alert("Se agregó "+checkingReturn[1]+" a la lista")
        }
    }else{
        alert('No hay nada escrito')
    }
    ipcRenderer.send('reloadAddWin','');
}
