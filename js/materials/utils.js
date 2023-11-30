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

    static TrowbridgeReitzMicrofacet(dirIn, roughnessX, roughnessY){
        const roughness = Vec3.new(roughnessX, roughnessY, 1)
        const dirReversed = Vec3.mulScalar(Vec3.clone(dirIn), -1)

        Vec3.normalize(Vec3.mul(dirReversed, roughness))

        const axisX = Vec3.normalize(Vec3.cross(Vec3.clone(Vec3.Z), dirReversed))
        const axisY = Vec3.normalize(Vec3.cross(Vec3.clone(dirReversed), axisX))

        let p = Vec3.random(Vec3.new())
        while(p.x*p.x + p.y*p.y >= 1){
            Vec3.random(p)
        }
        const h = Math.sqrt(1-p.x*p.x)
        const x = (1+dirReversed.z)/2
        p.y = p.y*x + h*(1-x)

        const pz = Math.sqrt(1-p.x*p.x-p.y*p.y)
        const normal = Vec3.add(
            Vec3.add(Vec3.mulScalar(axisX, p.x), Vec3.mulScalar(axisY, p.y)),
            Vec3.mulScalar(dirReversed, pz)
        )

        // Multiplication to keep the normals perpendicular to the surface
        return Vec3.normalize(Vec3.mul(normal, roughness))
    }
}