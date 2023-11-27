import { Material, MaterialTypes, Utils } from "./material.js"
import { Vec3, Color } from "../primitives.js"

export default class Transmitter extends Material{
    constructor(color, etaFrom=1, etaTo=1){
        super()
        this.type    = MaterialTypes.Transmitter
        this.color   = color
        this.etaFrom = etaFrom
        this.etaTo   = etaTo
    }

    static deserialize(mat){
        return new Transmitter(mat.color, mat.etaFrom, mat.etaTo)
    }

    hitLocal(dirIn){
        const cosI     = -dirIn.z
        const etaFrom  = dirIn.z > 0 ? this.etaTo   : this.etaFrom
        const etaTo    = dirIn.z > 0 ? this.etaFrom : this.etaTo
        const etaRatio = etaFrom/etaTo

        let cosT = Utils.cosTransmittedFromSnellLaw(etaRatio, cosI)

        let dirOut
        if(
            cosT == false || // Total internal reflection
            this.schlickApproximation(cosI, etaFrom, etaTo) > Math.random() // Schlick's approximation to the fresnel equations
        ){ 
            dirOut = Utils.reflect(dirIn)
        }else{
            
            dirOut = {x:dirIn.x*etaRatio, y:dirIn.y*etaRatio, z:cosT*Math.sign(dirIn.z)}
        }
        //console.log(Vec3.norm(dirOut))

        return {
            color: Color.mulScalar(Color.clone(this.color), 1),
            direction: dirOut
        }
    }

    sampleLocal(dirIn, dirOut){
        // The PDF is a Dirac distribution.
        // Intuitively, the chance that a given dirIn reflects to a given dirOut is zero, 
        // as all the radiance is reflected toward a single unique direction
        return Color.ZERO
    }

    schlickApproximation(cos, etaFrom, etaTo) {
        const r = (etaFrom-etaTo)/(etaFrom+etaTo)
        const rSqr = r*r
        return rSqr + (1-rSqr)*Math.pow(1-cos, 5)
    }

    /*sample(ray, normal){
        let etaRatio
        let cosI = Vec3.dot(ray.getDirection(), normal);
        ({etaRatio, cosI} = Utils.adjustIfExitingRay(cosI, this.etaFrom, this.etaTo, normal))

        let resultDir
        if(
            etaRatio * Math.sqrt(1-cosI*cosI) > 1 || // Total internal reflection
            this.schlickApproximation(cosI, this.etaFrom, this.etaTo) > Math.random() // Schlick's approximation to the fresnel equations
        ){ 
            resultDir = Utils.reflect(ray.getDirection(), normal)
        }else{
            const cos_transmitted = Utils.cosTransmittedFromSnellLaw(etaRatio, cosI)
            const incidentPerpendicular = Vec3.add(ray.getDirection(), Vec3.mulScalar( Vec3.clone(normal), cosI))
            const perpendicular = Vec3.mulScalar(incidentPerpendicular, etaRatio)
            const parallel = Vec3.mulScalar(normal, -cos_transmitted)
            resultDir = Vec3.add(perpendicular, parallel)
        }

        return {
            weight     : this.color,
            throughput : Color.ZERO,
            direction  : resultDir
        }
    }*/
}