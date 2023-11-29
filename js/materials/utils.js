import { Vec3 } from "../primitives.js"
import Diffuse     from "./diffuse.js"
import Conductor   from "./conductor.js"
import Reflector   from "./reflector.js"
import Transmitter from "./transmitter.js"
import Dielectric  from "./dielectric.js"

export const MaterialTypes = {
    Diffuse:     0,
    Reflector:   1,
    Transmitter: 2,
    Dielectric:  3,
    Conductor:   4
}

export function deserialize(mat){
    switch(mat.type){
        case MaterialTypes.Diffuse:
            return Diffuse.deserialize(mat)
        case MaterialTypes.Reflector:
            return Reflector.deserialize(mat)
        case MaterialTypes.Transmitter:
            return Transmitter.deserialize(mat)
        case MaterialTypes.Dielectric:
            return Dielectric.deserialize(mat)
        case MaterialTypes.Conductor:
            return Conductor.deserialize(mat)
        default:
            console.error(`Unknown material type : ${mat.type}`)
    }
}

export class Utils{
    static cosTransmittedFromSnellLaw(etaRatio, cosIncident){
        const squared = 1 - etaRatio*etaRatio*(1-cosIncident*cosIncident)
        return squared < 0 ? false : Math.sqrt(squared)
    }

    /* Assumes local coordinates */
    static areSameHemisphere(vec1, vec2){
        return vec1.z * vec2.z > 0
    }

    static reflect(dir){
        dir.z *= -1
        return dir
    }

    static reflectWithNormal(dir, normal){
        return Vec3.sub(Vec3.clone(dir), Vec3.mulScalar(Vec3.clone(normal), 2*Vec3.dot(dir, normal)))
    }
}