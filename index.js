let nextPageUrl = 'https://api.scryfall.com/cards/search?q=type:legendary'; // Initial API URL for legendary creatures
let creatures = []; // Initialize the creatures array

async function fetchLegendaryCreatures() {
    try {
        console.log("Fetching from URL:", nextPageUrl); // Log the URL
        const response = await fetch(nextPageUrl);
        if (!response.ok) {
            throw new Error(`Error fetching creatures: ${response.statusText}`);
        }
        const data = await response.json();
        
        // Log the fetched data for debugging
        console.log("Fetched data:", data);

        // Include all legendary creatures
        const filteredCreatures = data.data.filter(creature => {
            return (
                creature.type_line.includes('Legendary') || 
                (creature.type_line.includes('Planeswalker') && 
                 creature.oracle_text && 
                 creature.oracle_text.includes('Commander'))
            );
        });

        creatures.push(...filteredCreatures); // Add filtered creatures to the array
        nextPageUrl = data.has_more ? data.next_page : null; // Update nextPageUrl if more pages exist

        console.log(creatures); // Log all fetched creatures to check contents
        return creatures; // Return the full array of creatures
    } catch (error) {
        console.error("Error fetching creatures:", error);
        return []; // Return an empty array on error
    }
}

// Function to fetch deck suggestions from MTGGoldfish based on the creature's name
async function fetchDecks(creatureName) {
    const formattedName = creatureName.replace(/ /g, '+'); // Format the name for URL
    const mtgGoldfishApiUrl = `https://www.mtggoldfish.com/api/deck/format?name=${formattedName}`;

    try {
        const response = await fetch(mtgGoldfishApiUrl);
        if (response.ok) {
            const data = await response.json();
            return data.decks || []; // Return the array of decks
        } else {
            console.error("Error fetching decks:", response.statusText);
            return [];
        }
    } catch (error) {
        console.error("Error fetching decks:", error);
        return [];
    }
}

// Function to fetch a specific deck by its IDs
function fetchSpecificDeck(playerId, deckId) {
    const mtgGoldfishDeckApiUrl = `https://www.mtggoldfish.com/api/deck/${playerId}/${deckId}`;

    fetch(mtgGoldfishDeckApiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error fetching deck: ${response.statusText}`);
            }
            return response.json();
        })
        .then(deck => {
            console.log(deck);
            displaySpecificDeck(deck); // Call a function to display the deck
        })
        .catch(error => {
            console.error("Error fetching specific deck:", error);
        });
}

// Function to display the specific deck information
function displaySpecificDeck(deck) {
    const deckDiv = document.getElementById('decks');
    const cardList = deck.cards.map(card => `<li>${card.count}x ${card.name}</li>`).join('');
    const sideboardList = deck.sideboard.map(card => `<li>${card.count}x ${card.name}</li>`).join('');

    deckDiv.innerHTML += `
        <h3>Specific Deck by Player ${deck.player}</h3>
        <p>Result: ${deck.result}</p>
        <h4>Main Deck</h4>
        <ul>${cardList}</ul>
        <h4>Sideboard</h4>
        <ul>${sideboardList}</ul>
    `;
}

// Function to generate and display a random creature
async function generateCreature() {
    const creatures = await fetchLegendaryCreatures();
    if (creatures.length > 0) {
        const randomIndex = Math.floor(Math.random() * creatures.length);
        const randomCreature = creatures[randomIndex];
        displayCreature(randomCreature);
        const decks = await fetchDecks(randomCreature.name);
        displayDecks(decks);

        // Fetch a specific deck (example: player ID 7956, deck ID 245797)
        fetchSpecificDeck(7956, 245797);
    } else {
        document.getElementById('creature').innerHTML = "Could not fetch creatures.";
        document.getElementById('decks').innerHTML = "";
    }
}

// Function to display the creature's information
function displayCreature(creature) {
    const creatureDiv = document.getElementById('creature');

    // Check if the card has multiple faces
    let imageUrl = 'https://via.placeholder.com/150'; // Fallback image

    if (creature.card_faces) {
        // Use the first valid image found
        for (const face of creature.card_faces) {
            if (face.image_uris && face.image_uris.normal) {
                imageUrl = face.image_uris.normal;
                break; // Exit loop after finding the first valid image
            }
        }
    } else {
        imageUrl = creature.image_uris?.normal || imageUrl; // Fallback to normal image if no faces
    }

    creatureDiv.innerHTML = `
        <h2>${creature.name}</h2>
        <img src="${imageUrl}" alt="${creature.name}">
        <p>${creature.oracle_text || 'No description available.'}</p>
    `;
}

// Function to display deck suggestions
function displayDecks(decks) {
    const decksDiv = document.getElementById('decks');
    if (decks.length === 0) {
        decksDiv.innerHTML = "<p>No deck suggestions available.</p>";
        return;
    }

    const deckList = decks.map(deck => `<li>${deck.name} - <a href="${deck.url}" target="_blank">View Deck</a></li>`).join('');
    decksDiv.innerHTML = `
        <h3>Deck Suggestions</h3>
        <ul>${deckList}</ul>
    `;
}

// Add event listener to the button to generate a creature on click
document.getElementById('generate-btn').addEventListener('click', generateCreature);
