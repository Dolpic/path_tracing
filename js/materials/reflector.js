import { Material } from "./material.js"
import { MaterialTypes, Utils } from "./utils.js"
import { Vec3, Color } from "../primitives.js"

export default class Reflector extends Material{
    constructor(color, granularity=0){
        super()
        this.type        = MaterialTypes.Reflector
        this.color       = color
        this.granularity = granularity
    }

    static deserialize(mat){
        return new Reflector(mat.color, mat.granularity)
    }

    hitLocal(dirIn){
        let dirOut = Utils.reflect(Vec3.clone(dirIn))
        if(this.granularity > 0){
            Vec3.add(dirOut, Vec3.mulScalar(Vec3.randomOnHemisphere(Vec3.new()), this.granularity)  )
        }
        return {
            color: Color.mulScalar(Color.clone(this.color), 1/Math.abs(dirOut.z)),
            direction: dirOut
        }
    }

    sampleLocal(dirIn, dirOut){
        // The PDF is a Dirac distribution.
        // Intuitively, the chance that a given dirIn reflects to a given dirOut is zero, 
        // as all the radiance is reflected toward a single unique direction
        return Color.clone(Color.ZERO)
    }
}