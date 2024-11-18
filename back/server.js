const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const data = require('../_data/data'); 
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('../front'));
app.use(express.json());

function saveData() {
    fs.writeFileSync(path.join(__dirname, '../_data/data.json'), JSON.stringify(data, null, 2));
}

// Endpoint pour récupérer les listes
app.get('/lists', (req, res) => {
    const listNames = data.lists.map(list => list.name);
    res.json(listNames);
});

// Endpoint pour récupérer les éléments d'une liste
app.get('/lists/:nameList', (req, res) => {
    const nameList = req.params.nameList;
    const list = data.lists.find(list => list.name === nameList);

    if (list) {
        res.json(list.items);
    } else {
        res.status(404).json({ error: 'List not found' });
    }
});

// Route pour créer une nouvelle liste
app.post('/lists', (req, res) => {
    const { name, owner } = req.body;
    const newList = {
        id: data.lists.length + 1,
        name,
        owner,
        coAuthors: [],
        items: [],
    };
    data.lists.push(newList);

    saveData(); // Sauvegarde des modifications dans data.json

    res.status(201).json(newList);
});

// Route pour mettre à jour une liste
app.put('/lists/:id', (req, res) => {
    const listId = parseInt(req.params.id);
    const { name, owner } = req.body;
    const list = data.lists.find(l => l.id === listId);
    
    if (list) {
        list.name = name || list.name; 
        list.owner = owner || list.owner; 

        saveData(); 
        res.json(list);
    } else {
        res.status(404).json({ error: 'List not found' });
    }
});

// Route pour supprimer une liste
app.delete('/lists/:id', (req, res) => {
    const listId = parseInt(req.params.id);
    const listIndex = data.lists.findIndex(l => l.id === listId);

    if (listIndex > -1) {
        data.lists.splice(listIndex, 1); 
        saveData(); 
        res.status(200).json({ message: 'List deleted successfully' });
    } else {
        res.status(404).json({ error: 'List not found' });
    }
});

// Route pour ajouter un co-auteur à une liste
app.post('/lists/:id/invite', (req, res) => {
    const listId = parseInt(req.params.id);
    const { coAuthor } = req.body; 

    const list = data.lists.find(l => l.id === listId);

    if (list) {
        // Ajout du co-auteur à la liste
        if (!list.coAuthors.includes(coAuthor)) {
            list.coAuthors.push(coAuthor);
            saveData(); 
            io.emit('listUpdated', list);
            res.status(200).json({ message: 'Co-author added successfully' });
        } else {
            res.status(400).json({ error: 'Co-author already exists' });
        }
    } else {
        res.status(404).json({ error: 'List not found' });
    }
});


io.on('connection', (socket) => {
    console.log('A user connected');
    
    socket.on('addContributor', (listId, contributor) => {
        const list = data.lists.find(l => l.id == listId);
        if (list) {
            list.coAuthors.push(contributor);
            io.emit('listUpdated', list);
            saveData(); 
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
