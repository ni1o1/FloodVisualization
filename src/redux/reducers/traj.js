const initState = {
    waterheight: 1
}
export default function trajReducer(preState = initState, action) {
    const { type, data } = action
    switch (type) {
        case 'setwaterheight':
            return {...preState, waterheight: data }
        default:
            return preState;
    }
}