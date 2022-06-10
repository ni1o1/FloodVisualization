//汇总reducer
import { combineReducers } from 'redux'
import traj from './traj'
import Visualcamera from './Visualcamera'
export default combineReducers({
    traj,
    Visualcamera
})