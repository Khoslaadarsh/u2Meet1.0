// data base can be used

const users = [];

// Join user to chat
function userJoin(id, userName, room){
    const user = { id, userName, room};
    
    users.push(user);
    return user;
}

// Get the current user
function GetCurrentUser(id){
    
    const user = users.find(usr=> usr.id === id );
    return user;
}

// User Leaves
function userLeave(id){
    // console.log(id);
    const index = users.findIndex(usr=> usr.id == id );
    // console.log(index);
    if(index !== -1){
        // console.log(users.splice(index,1)[0]);
        return users.splice(index,1)[0];
    }
}

// Get room users
function getRoomUsers(room){
    return users.filter(user=>user.room === room);
}

module.exports = {
    userJoin,
    GetCurrentUser,
    userLeave,
    getRoomUsers
}
