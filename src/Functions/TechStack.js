import { db } from '../firebase'
import { collection, getDocs, addDoc, deleteDoc, query, where, doc } from 'firebase/firestore'


export function removeTechFromDB(user, techName, onClose, allTech, setTech) {
    getDocs(query(
        collection(db, "dev_sec_ops_tech"),
        where("owner", "==", user.uid),
        where("name", "==", techName)
    )).then(data => {
        const tech = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
        try {
            tech.forEach(asset => {
                const assetDoc = doc(db, "dev_sec_ops_tech", asset.id)
                deleteDoc(assetDoc)
                .finally( () => {
                    removeTechFromStack(allTech, setTech, techName);
                    onClose(true)
                }
                )
            })
        } catch (error) {
            onClose(true);
        }

    })

}

function removeTechFromStack(techStack, setTech, techName) {
    // const newTechStack = JSON.parse(JSON.stringify(techStack));
    // newTechStack.pop
    const newTechStack = techStack.filter(tech => 
        tech.name !== techName
    )
    setTech(newTechStack);
    return newTechStack;
}

function addTechToStack(techStack, setTechStack, techName, assetName, techDescription, imageUrl, guardsSensitiveData, user) {
    const newTechStack = JSON.parse(JSON.stringify(techStack));
    newTechStack.push({
        name: techName,
        asset: assetName,
        description: techDescription,
        image: imageUrl,
        storesData: guardsSensitiveData,
        owner: user.uid
    })
    setTechStack(newTechStack);
    return newTechStack;
}

// TODO - This is nasty! It needs to be refactored to have fewer inputs
export function addSensitiveDataTechToDB(whatChips, whoChips, howChips, whyChips, tech, user, assetName, onClose, setTech, allTech) {
    const techCollectionRef = collection(db, "dev_sec_ops_tech")

    // Filter to the selected chips
    const whatArray = getSelectedChips(whatChips);
    const whoArray = getSelectedChips(whoChips);
    const howArray = getSelectedChips(howChips);
    const whyArray = getSelectedChips(whyChips);
        
    // push the selected assets to firebase
    addDoc(techCollectionRef, {
        name: tech.name,
        owner: user.uid,
        what: whatArray,
        who: whoArray,
        how: howArray,
        why: whyArray,
        description: tech.description,
        asset: assetName,
        image: tech.image,
        storesData: tech.guards_sensitive_data
    }).then(
        response => {
            // console.log(response)
            addTechToStack(allTech, setTech, tech.name, assetName, tech.description, tech.image, tech.guards_sensitive_data, user) 
            onClose(true)
        }
    ).catch(err => {
        // console.log(err)
    })

}

function getSelectedChips(chips) {
    const selectedChips = chips.filter(function (singleChip) {
        return singleChip.selected
    })
    return selectedChips.map(function (item) {
        return item['name'];
    });
}


// TODO - This is nasty! It needs to be refactored to have fewer inputs
export function addTechToDB(chips, techName, assetName, techDescription, imageUrl, guardsSensitiveData, user, onClose, toast, techStack, setTechStack) {
    const techCollectionRef = collection(db, "dev_sec_ops_tech")
    // if there are no chips, then this is a tech such as authentication or WAF where it has no extra parameters. If some ch
    if (chips.length === 0) {
        addDoc(techCollectionRef, {
            name: techName,
            asset: techName,
            description: techDescription,
            image: imageUrl,
            storesData: guardsSensitiveData,
            owner: user.uid
        })
            .then(
                addTechToStack(techStack, setTechStack, techName, assetName, techDescription, imageUrl, guardsSensitiveData, user)
            )
            .then(
                onClose(true)
            )
        return;
    }
    // Filter to the selected chips
    const selectedTech = chips.filter(function (tech) {
        return tech.selected
    })
    // if no chips are selected, throw an error and do nothing
    if (selectedTech.length === 0) {
        toast.error("Please select the tech that you use.")
        return
    }
    // push the selected assets to firebase
    let newTechStack = JSON.parse(JSON.stringify(techStack));
    selectedTech.forEach(asset => {
        addDoc(techCollectionRef, {
            name: techName,
            image: imageUrl,
            asset: asset.name,
            storesData: guardsSensitiveData,
            description: techDescription,
            owner: user.uid
        }).then(
            newTechStack = addTechToStack(newTechStack, setTechStack, techName, asset.name, techDescription, imageUrl, guardsSensitiveData, user)
        )
    });
    onClose(true)
}


export function getTechStack(user) {
    return new Promise((resolve, reject) => {
        // eslint-disable-next-line 
        if (user.uid == undefined) {
            reject('user_error');
        }
        try {
            getDocs(
                query(
                    collection(db, "dev_sec_ops_tech"),
                    where("owner", "==", user.uid)
                )).then((data => {
                    resolve(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
                }))
                .catch((err) => {
                    reject("error");
                });


        } catch (err) {
            reject("error");
        }
    })
}
