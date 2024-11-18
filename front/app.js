const socket = io("http://localhost:3000");
const listsContainer = document.getElementById("lists");
const listItems = document.getElementById("listItems");

// Fonction pour créer une nouvelle liste
function createList() {
    const listName = document.getElementById("listName").value;
    const owner = "OwnerName"; 

    fetch("/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: listName, owner: owner }),
    })
        .then((response) => response.json())
        .then((newList) => {
            const listElement = document.createElement("li");
            listElement.textContent = `${newList.name} (Owner: ${newList.owner})`;
            listsContainer.appendChild(listElement);
        });
}

// Récupérer toutes les listes au chargement de la page
fetch("/lists")
    .then((response) => response.json())
    .then((lists) => {
        lists.forEach((element) => {
            const listName = document.createElement("li");
            const listButton = document.createElement("button");
            listButton.textContent = element;

            listButton.addEventListener("click", () => {
                loadListContent(element);
            });

            listName.appendChild(listButton);
            listsContainer.appendChild(listName);
        });
    });

// Fonction pour charger les éléments d'une liste
function loadListContent(listName) {
    const nameList = encodeURIComponent(listName); // Encodage du nom de la liste

    fetch(`/lists/${nameList}`)
        .then((response) => response.json())
        .then((items) => {
            listItems.innerHTML = ""; // Vider la liste existante

            items.forEach((element) => {
                const listItem = document.createElement("li");
                listItem.textContent = `${element.name} (Ajouté par: ${element.contributedBy}, Statut: ${element.status})`;
                listItems.appendChild(listItem);
            });
        });
}

// Fonction pour mettre à jour une liste
function updateList(listId) {
    const newName = prompt("Enter new list name:");
    const newOwner = prompt("Enter new owner name:");

    fetch(`/lists/${listId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, owner: newOwner }),
    })
        .then((response) => response.json())
        .then((updatedList) => {
            console.log("List updated!");
            loadListContent(updatedList.name);
        });
}

// Fonction pour supprimer une liste
function deleteList(listId) {
    fetch(`/lists/${listId}`, {
        method: "DELETE",
    })
        .then((response) => response.json())
        .then(() => {
            console.log("List deleted!");
            location.reload(); 
        });
}

// Fonction pour inviter un co-auteur à rejoindre une liste
function inviteCoAuthor(listId) {
    const coAuthor = prompt("Enter the name of the co-author:");

    fetch(`/lists/${listId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coAuthor: coAuthor }),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log(data.message);
            loadListContent(listId); // Recharger le contenu de la liste
        });
}

// Charger la liste et afficher les boutons d'actions
function loadListContent(listName) {
    const nameList = encodeURIComponent(listName);

    fetch(`/lists/${nameList}`)
        .then((response) => response.json())
        .then((items) => {
            listItems.innerHTML = "";

            // Affichage des éléments
            items.forEach((element) => {
                const listItem = document.createElement("li");
                listItem.textContent = `${element.name} (Ajouté par: ${element.contributedBy}, Statut: ${element.status})`;
                listItems.appendChild(listItem);
            });

            // Ajouter des boutons de mise à jour, suppression et invitation
            const updateButton = document.createElement("button");
            updateButton.textContent = "Update List";
            updateButton.onclick = () => updateList(listName);

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete List";
            deleteButton.onclick = () => deleteList(listName);

            const inviteButton = document.createElement("button");
            inviteButton.textContent = "Invite Co-Author";
            inviteButton.onclick = () => inviteCoAuthor(listName);

            listItems.appendChild(updateButton);
            listItems.appendChild(deleteButton);
            listItems.appendChild(inviteButton);
        });
}


// Écouter les événements en temps réel pour mettre à jour l'interface
socket.on('listUpdated', (updatedList) => {
    console.log('List updated:', updatedList);
    loadListContent(updatedList.name);
});
