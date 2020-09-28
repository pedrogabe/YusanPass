const fs = require('fs');
const path = require('path')
const {app, BrowserWindow, Menu, ipcMain} = require('electron');

var mainWin;
app.on('ready',function(){
    mainWin = new BrowserWindow({height:600,width:800,webPreferences:{nodeIntegration:true}});
    mainWin.loadFile('mainWin/main.html');
    var customMenu = [
        {label:"Lista", submenu:[
            {label:"Agregar", click:openAddWin, accelerator:"Ctrl+N"},
            {label:"Mirar lista", click(){mainWin.webContents.send('displayPasswords',passwordsList)}, accelerator:"Ctrl+L"},
        ]},
        {label:"Debug", submenu:[
            {label:"Refresh", role:'reload', accelerator:"f5"},
            {role:'toggledevtools'},
            {label:"Refrescar lista", accelerator:"Ctrl+R", click(){loadPasswords()}}
        ]}
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(customMenu))
    mainWin.on('close',function(){
        app.exit();
        console.log('Finished by closing window')
    })
})


var addWin
function openAddWin(){
    if(addWin==null){
        addWin = new BrowserWindow({height:100,width:250,webPreferences:{nodeIntegration:true},title:"Agregar item"});
        addWin.setMenuBarVisibility(false);
        addWin.loadFile('./addWin/addWin.html')
    }
    else{
        addWin.close();
        addWin = new BrowserWindow({height:100,width:250,webPreferences:{nodeIntegration:true},title:"Agregar item"});
        addWin.setMenuBarVisibility(false);
        addWin.loadFile('./addWin/addWin.html')
    }
    addWin.on('close',function(){addWin=null;})
}

var filePath = path.join(__dirname,'list.txt')

var passwordsList=[], usable=[], neverUsed=[];
var fileString;//Quizás sería más simple usando archivos JSON
function loadPasswords(){
    fs.readFile(filePath,'UTF-8',function(err,data){
        if(err){
            console.log(err)
        }else{
            fileString=data;
            passwordsList=[], usable=[], neverUsed=[];
            data.split('¿¿¿').forEach(function(pass){
                let passAndBool = pass.split(':')
                passwordsList.push(passAndBool)
            })
            passwordsList.forEach(function(pass){
                if(pass[1]=="usable"){
                    usable.push(pass[0])
                }
                else if(pass[1]=="nuevo"){
                    neverUsed.push(pass[0])
                }
            })
        }
    })
}
loadPasswords()

ipcMain.on('checkPass',function(e,newPass){
    var exists;
    for(i in passwordsList){
        let writtenPasword = passwordsList[i];
        let writtenpassword = writtenPasword[0].toLowerCase();
        writtenpassword = writtenpassword.replace(' ','-');
        let newpass = newPass.toLowerCase();
        newpass = newpass.replace(' ','-');
        if(newpass==writtenpassword){
            exists=writtenPasword[0];
            break;
        }
    }

    if(exists){
        e.returnValue=["alreadyExists",exists]
    }else{
        fs.appendFileSync('list.txt','¿¿¿'+newPass+':nuevo','UTF-8');
        e.returnValue=["added",newPass]
        loadPasswords()
    }
})

ipcMain.on('reloadAddWin',openAddWin)

ipcMain.on('sort',function(e,discarded){
    var passwordsUsable=[[],[]];
    neverUsed.forEach(function(pass,i){
        passwordsUsable[0][i]=pass
    })
    usable.forEach(function(pass,i){
        passwordsUsable[1][i]=pass
    })
    if(discarded.length>0){
        discarded.forEach(function(i){
            passwordsUsable[i[0]].splice(i[1],1);
        })
    }
    if(passwordsUsable[0].length>0){
        let x = Math.random()*passwordsUsable[0].length;
        x = Math.floor(x);
        e.returnValue=[passwordsUsable[0][x],[0,x]];
    }else{
        let x = Math.random()*passwordsUsable[1].length;
        x = Math.floor(x);
        e.returnValue=[passwordsUsable[1][x],[1,x]];
    }
})

ipcMain.on('changeToUsed',function(e,selectedPass){
    fileString = fileString.replace(selectedPass+':usable',selectedPass+':usado');
    fileString = fileString.replace(selectedPass+':nuevo',selectedPass+':usado');
    fs.writeFileSync(filePath,fileString);
    loadPasswords();
    if((usable.length+neverUsed.length) == 1){
        e.returnValue=false;
    }else{
        e.returnValue=true;
    }
})

ipcMain.on('setAllToUsable',function(e){
    fileString = fileString.replaceAll('usado','usable');
    fs.writeFileSync(filePath,fileString);
    e.returnValue=null;
})