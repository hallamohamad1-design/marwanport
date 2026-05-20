#include <iostream>
#include <queue>
#include <stack>
#include <string>
#include <unordered_map>
#include <vector>

using namespace std;

struct BoardedPassenger {
    string name;
    string type;
};

struct BSTNode {
    string passengerName;
    string flightNumber;
    string gateNumber;
    string status; 
    BSTNode* left;
    BSTNode* right;

    BSTNode(string name, string flight, string gate, string stat) {
        passengerName = name;
        flightNumber = flight;
        gateNumber = gate;
        status = stat;
        left = nullptr;
        right = nullptr;
    }
};

class Gate {
private:
    string gateNumber;
    string flightNumber;
    string origin;
    string destination;

    queue<string> vipQueue;
    queue<string> normalQueue;
    stack<BoardedPassenger> boardingStack;

public:
    Gate() {}

    Gate(string gNum, string fNum, string orig, string dest) {
        gateNumber = gNum;
        flightNumber = fNum;
        origin = orig;
        destination = dest;
    }

    string getGateNumber() { return gateNumber; }
    string getFlightNumber() { return flightNumber; }
    string getOrigin() { return origin; }
    string getDestination() { return destination; }
    int getWaitingCount() { return vipQueue.size() + normalQueue.size(); }
    int getVIPCount() { return vipQueue.size(); }
    int getNormalCount() { return normalQueue.size(); }
    int getBoardedCount() { return boardingStack.size(); }

    void addPassenger(string name, string type) {
        if (type == "VIP") {
            vipQueue.push(name);
            cout << name << " (VIP) added to gate " << gateNumber << " (Flight " << flightNumber << ")\n";
        } else {
            normalQueue.push(name);
            cout << name << " (Normal) added to gate " << gateNumber << " (Flight " << flightNumber << ")\n";
        }
    }

    string boardPassenger() {
        string name, type;
        if (!vipQueue.empty()) {
            name = vipQueue.front();
            type = "VIP";
            vipQueue.pop();
        } else if (!normalQueue.empty()) {
            name = normalQueue.front();
            type = "Normal";
            normalQueue.pop();
        } else {
            return "";
        }

        BoardedPassenger bp;
        bp.name = name;
        bp.type = type;
        boardingStack.push(bp);

        cout << name << " boarded from gate " << gateNumber << " (Flight " << flightNumber << ")\n";
        return name;
    }

    void displayWaitingPassengers() {
        queue<string> tempVIP = vipQueue;
        queue<string> tempNormal = normalQueue;

        cout << "  VIP waiting: ";
        if (tempVIP.empty()) cout << "none";
        while (!tempVIP.empty()) {
            cout << tempVIP.front() << " ";
            tempVIP.pop();
        }
        cout << endl;

        cout << "  Normal waiting: ";
        if (tempNormal.empty()) cout << "none";
        while (!tempNormal.empty()) {
            cout << tempNormal.front() << " ";
            tempNormal.pop();
        }
        cout << endl;
    }

    void displayBoardingHistory() {
        stack<BoardedPassenger> tempStack = boardingStack;
        cout << "  Boarded (most recent first): ";
        if (tempStack.empty()) {
            cout << "none";
        }
        while (!tempStack.empty()) {
            cout << tempStack.top().name << " (" << tempStack.top().type << ") ";
            tempStack.pop();
        }
        cout << endl;
    }

    bool passengerExists(string name) {
        queue<string> tempVIP = vipQueue;
        queue<string> tempNormal = normalQueue;

        while (!tempVIP.empty()) {
            if (tempVIP.front() == name) return true;
            tempVIP.pop();
        }
        while (!tempNormal.empty()) {
            if (tempNormal.front() == name) return true;
            tempNormal.pop();
        }

        stack<BoardedPassenger> tempStack = boardingStack;
        while (!tempStack.empty()) {
            if (tempStack.top().name == name) return true;
            tempStack.pop();
        }
        return false;
    }

    string undoLastBoarding() {
        if (boardingStack.empty()) return "";

        BoardedPassenger bp = boardingStack.top();
        boardingStack.pop();

        if (bp.type == "VIP") {
            vipQueue.push(bp.name);
            cout << "Undo: " << bp.name << " (VIP) returned to VIP queue at gate " << gateNumber << endl;
        } else {
            normalQueue.push(bp.name);
            cout << "Undo: " << bp.name << " (Normal) returned to Normal queue at gate " << gateNumber << endl;
        }

        return bp.name;
    }

    void sortBoardingStack() {
        stack<BoardedPassenger> tempStack;
        while (!boardingStack.empty()) {
            BoardedPassenger bp = boardingStack.top();
            boardingStack.pop();

            while (!tempStack.empty() && tempStack.top().name > bp.name) {
                boardingStack.push(tempStack.top());
                tempStack.pop();
            }
            tempStack.push(bp);
        }
        boardingStack = tempStack;
        cout << "Boarding stack sorted alphabetically for gate " << gateNumber << endl;
    }
};

unordered_map<string, Gate> flightMap;
BSTNode* bstRoot = nullptr;
unordered_map<string, vector<string>> flightGraph;


BSTNode* insertBST(BSTNode* root, string name, string flight, string gate, string status) {
    if (root == nullptr) return new BSTNode(name, flight, gate, status);
    if (name < root->passengerName)
        root->left = insertBST(root->left, name, flight, gate, status);
    else if (name > root->passengerName)
        root->right = insertBST(root->right, name, flight, gate, status);
    return root;
}

BSTNode* searchBST(BSTNode* root, string name) {
    if (root == nullptr || root->passengerName == name) return root;
    if (name < root->passengerName) return searchBST(root->left, name);
    return searchBST(root->right, name);
}

void updateBSTStatus(string name, string newStatus) {
    BSTNode* node = searchBST(bstRoot, name);
    if (node != nullptr) {
        node->status = newStatus;
    }
}

void inorderBST(BSTNode* root) {
    if (root == nullptr) return;
    inorderBST(root->left);
    cout << "  " << root->passengerName << " | Flight: " << root->flightNumber
         << " | Gate: " << root->gateNumber << " | Status: " << root->status << endl;
    inorderBST(root->right);
}

BSTNode* findMin(BSTNode* root) {
    while (root && root->left != nullptr) root = root->left;
    return root;
}

BSTNode* deleteFromBST(BSTNode* root, string name) {
    if (root == nullptr) return root;
    if (name < root->passengerName)
        root->left = deleteFromBST(root->left, name);
    else if (name > root->passengerName)
        root->right = deleteFromBST(root->right, name);
    else {
        if (root->left == nullptr && root->right == nullptr) {
            delete root;
            return nullptr;
        } else if (root->left == nullptr) {
            BSTNode* temp = root->right;
            delete root;
            return temp;
        } else if (root->right == nullptr) {
            BSTNode* temp = root->left;
            delete root;
            return temp;
        } else {
            BSTNode* temp = findMin(root->right);
            root->passengerName = temp->passengerName;
            root->flightNumber = temp->flightNumber;
            root->gateNumber = temp->gateNumber;
            root->status = temp->status;
            root->right = deleteFromBST(root->right, temp->passengerName);
        }
    }
    return root;
}


void buildFlightGraph() {
    flightGraph.clear();
    for (auto& pair : flightMap) {
        Gate& g = pair.second;
        flightGraph[g.getOrigin()].push_back(g.getDestination());
    }
}

void shortestPathBFS(string start, string end) {
    if (start == end) {
        cout << "You are already at " << start << endl;
        return;
    }

    queue<string> q;
    unordered_map<string, bool> visited;
    unordered_map<string, string> parent;

    q.push(start);
    visited[start] = true;
    parent[start] = "";

    while (!q.empty()) {
        string current = q.front();
        q.pop();

        for (string neighbor : flightGraph[current]) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                parent[neighbor] = current;
                q.push(neighbor);

                if (neighbor == end) {
                    vector<string> path;
                    string node = end;
                    while (node != "") {
                        path.push_back(node);
                        node = parent[node];
                    }
                    cout << "Shortest path from " << start << " to " << end << ": ";
                    for (int i = path.size() - 1; i >= 0; i--) {
                        cout << path[i];
                        if (i > 0) cout << " -> ";
                    }
                    cout << endl;
                    return;
                }
            }
        }
    }
    cout << "No path found from " << start << " to " << end << endl;
}


void addFlight() {
    string flightNumber, gateNumber, origin, destination;

    cout << "Enter flight number: ";
    cin >> flightNumber;
    if (flightMap.find(flightNumber) != flightMap.end()) {
        cout << "Flight already exists!\n";
        return;
    }

    cout << "Enter origin city: ";
    cin >> origin;

    cout << "Enter destination city: ";
    cin >> destination;

    cout << "Enter gate number (e.g., A1, B2): ";
    cin >> gateNumber;

    Gate newGate(gateNumber, flightNumber, origin, destination);
    flightMap[flightNumber] = newGate;

    cout << "\n=== Flight Added Successfully ===\n";
    cout << "Flight " << flightNumber << " from " << origin << " to " << destination << " at Gate " << gateNumber << endl;
    cout << "================================\n\n";
}

void addPassenger() {
    string name, type, flightNumber;
    cout << "Enter passenger name: ";
    cin >> name;
    if (searchBST(bstRoot, name) != nullptr) {
        cout << "Passenger already exists in system!\n";
        return;
    }
    cout << "Enter passenger type (VIP / Normal): ";
    cin >> type;
    if (type != "VIP" && type != "Normal") {
        cout << "Invalid type!\n";
        return;
    }
    cout << "Enter flight number: ";
    cin >> flightNumber;
    if (flightMap.find(flightNumber) == flightMap.end()) {
        cout << "Flight not found! Please add flight first.\n";
        return;
    }

    Gate& gate = flightMap[flightNumber];
    gate.addPassenger(name, type);
    bstRoot = insertBST(bstRoot, name, flightNumber, gate.getGateNumber(), "waiting");
}

void boardPassenger() {
    string flightNumber;
    cout << "Enter flight number: ";
    cin >> flightNumber;
    if (flightMap.find(flightNumber) == flightMap.end()) {
        cout << "Flight not found!\n";
        return;
    }
    Gate& gate = flightMap[flightNumber];
    string boardedName = gate.boardPassenger();
    if (boardedName.empty()) {
        cout << "No passengers waiting for this flight.\n";
        return;
    }
    updateBSTStatus(boardedName, "boarded");
}

void searchPassenger() {
    string name;
    cout << "Enter passenger name: ";
    cin >> name;
    BSTNode* result = searchBST(bstRoot, name);
    if (result == nullptr) {
        cout << "Passenger not found.\n";
    } else {
        cout << "\n=== Passenger Found ===\n";
        cout << "Name: " << result->passengerName << endl;
        cout << "Flight: " << result->flightNumber << endl;
        cout << "Gate: " << result->gateNumber << endl;
        cout << "Status: " << result->status << endl;
        cout << "======================\n\n";
    }
}

void displayAllFlights() {
    if (flightMap.empty()) {
        cout << "No flights available.\n";
        return;
    }
    cout << "\n=== All Flights ===\n";
    for (auto& pair : flightMap) {
        Gate& g = pair.second;
        cout << "Flight: " << g.getFlightNumber()
             << " | From: " << g.getOrigin()
             << " | To: " << g.getDestination()
             << " | Gate: " << g.getGateNumber()
             << " | Waiting: " << g.getWaitingCount() << endl;
        g.displayWaitingPassengers();
        cout << "-------------------\n";
    }
}

void displayGateDetails() {
    string flightNumber;
    cout << "Enter flight number: ";
    cin >> flightNumber;
    if (flightMap.find(flightNumber) == flightMap.end()) {
        cout << "Flight not found!\n";
        return;
    }
    Gate& gate = flightMap[flightNumber];
    cout << "\n=== Gate Details for Flight " << flightNumber << " ===\n";
    cout << "Gate Number: " << gate.getGateNumber() << endl;
    cout << "From: " << gate.getOrigin() << endl;
    cout << "To: " << gate.getDestination() << endl;
    cout << "\n--- Waiting Passengers ---\n";
    gate.displayWaitingPassengers();
    cout << "\n--- Boarding History ---\n";
    gate.displayBoardingHistory();
    cout << "================================\n\n";
}

void displayAllPassengersSorted() {
    if (bstRoot == nullptr) {
        cout << "No passengers in system.\n";
        return;
    }
    cout << "\n=== All Passengers (Sorted by Name) ===\n";
    inorderBST(bstRoot);
    cout << "========================================\n\n";
}

void undoLastBoardingMenu() {
    string flightNumber;
    cout << "Enter flight number: ";
    cin >> flightNumber;

    if (flightMap.find(flightNumber) == flightMap.end()) {
        cout << "Flight not found!\n";
        return;
    }

    Gate& gate = flightMap[flightNumber];
    string passengerName = gate.undoLastBoarding();

    if (passengerName != "") {
        updateBSTStatus(passengerName, "waiting");
    } else {
        cout << "Nothing to undo.\n";
    }
}

void sortBoardingStackMenu() {
    string flightNumber;
    cout << "Enter flight number: ";
    cin >> flightNumber;
    if (flightMap.find(flightNumber) == flightMap.end()) {
        cout << "Flight not found!\n";
        return;
    }
    flightMap[flightNumber].sortBoardingStack();
}

void deletePassengerMenu() {
    string name;
    cout << "Enter passenger name to delete: ";
    cin >> name;
    BSTNode* node = searchBST(bstRoot, name);
    if (node == nullptr) {
        cout << "Passenger not found!\n";
        return;
    }
    bstRoot = deleteFromBST(bstRoot, name);
    cout << "Passenger " << name << " deleted successfully from system.\n";
}

void findShortestPathMenu() {
    buildFlightGraph();
    string from, to;
    cout << "Enter departure city: ";
    cin >> from;
    cout << "Enter arrival city: ";
    cin >> to;
    shortestPathBFS(from, to);
}


int main() {
    int choice;

    cout << "\n========================================\n";
    cout << "   AIRPORT MANAGEMENT SYSTEM\n";
    cout << "========================================\n";

    do {
        cout << "\n========== MENU ==========\n";
        cout << "1. Add New Flight\n";
        cout << "2. Add Passenger to Flight\n";
        cout << "3. Board Passenger\n";
        cout << "4. Search Passenger\n";
        cout << "5. Display All Flights\n";
        cout << "6. Display Gate Details\n";
        cout << "7. Display All Passengers\n";
        cout << "8. Undo Last Boarding\n";
        cout << "9. Sort Boarding Stack\n";
        cout << "10. Delete Passenger\n";
        cout << "11. Find Shortest Path BFS\n";
        cout << "0. Exit\n";
        cout << "Enter choice: ";
        cin >> choice;

        switch (choice) {
            case 1: addFlight(); break;
            case 2: addPassenger(); break;
            case 3: boardPassenger(); break;
            case 4: searchPassenger(); break;
            case 5: displayAllFlights(); break;
            case 6: displayGateDetails(); break;
            case 7: displayAllPassengersSorted(); break;
            case 8: undoLastBoardingMenu(); break;
            case 9: sortBoardingStackMenu(); break;
            case 10: deletePassengerMenu(); break;
            case 11: findShortestPathMenu(); break;
            case 0: cout << "Program ended.\n"; break;
            default: cout << "Invalid choice!\n";
        }
    } while (choice != 0);

    return 0;
}