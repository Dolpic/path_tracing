import Timer from "./Timer.js"
import { Color } from "./primitives.js"
import { sampleLight, LIGHTS } from "./Lights.js"
import { Vec3 } from "./primitives.js"

class Tracer{
    constructor(objStructure, lights, maxDepth=10, lightSampling=true, timer=false){
        this.objStructure = objStructure
        this.lights    = lights.filter(l=>l.type!=LIGHTS.EnvironmentalLight)
        this.envLights = lights.filter(l=>l.type==LIGHTS.EnvironmentalLight)
        this.lightSampling = lightSampling
        this.maxDepth = maxDepth
        this.timer = timer ? new Timer() : false
    }

    trace(ray){
        for(let i=0; i<this.maxDepth; i++){
            //if(this.timer) this.timer.start()

            const {t, objHit} = this.objStructure.findIntersection(ray)
            if(t === Infinity){
                const envLight = sampleLight(this.envLights)
                if(envLight != undefined){
                   ray.addToThroughput(envLight.getRadiance(ray)) 
                }
                break
            }
            ray.moveOriginAt(t)
            //if(this.timer) this.timer.step("Intersection")
            if(!this.interaction(ray, objHit)){
                break
            }
            //if(this.timer) this.timer.step("Interaction")

            /*if(i == this.maxDepth-1){
                ray.color.r = 1
            }*/
        }
    }

    printTimerResult(){
        if(this.timer) this.timer.result()
    }
}

/*
    This tracer samples ray at random at each intersection
*/
export class RandomWalkTracer extends Tracer{
    constructor(...params){
        super(...params)
    }

    interaction(){
        // TODO
    }
}

/*
    This tracer uses the importance sampling provided by the materials
*/
export class PathTracer extends Tracer{
    constructor(...params){
        super(...params)
    }

    interaction(ray, objHit){
        if(this.lightSampling){

            const normal = objHit.normalAt(ray.origin)
            const hitResult = objHit.material.hit(ray.getDirection(), normal)

            if(hitResult){
                const light = sampleLight(this.lights)
                if(light != undefined){

                    const {ray:lightRay, t:lightT} = light.getRay(ray.origin)
                    const sampleColor = objHit.material.sample(ray.getDirection(), lightRay.getDirection(), normal)

                    if(sampleColor != Color.ZERO){
                        if(!this.objStructure.isOccluded(lightRay, lightT)){
                            const lightColor = light.getRadiance(ray)
                            const lightCosAngle = Math.abs(Vec3.dot(lightRay.getDirection(), normal))
                            const throughputColor = Color.mulScalar(Color.mul(Color.clone(sampleColor), lightColor), lightCosAngle)
                            ray.addToThroughput(throughputColor)
                        }
                    }
                }
    
                ray.setDirection(hitResult.direction)
                const weightFactor = Color.mulScalar(Color.clone(hitResult.color), Math.abs(Vec3.dot(hitResult.direction, normal)))
                ray.updatePathWeight(weightFactor)
                return true
            }else{
                return false
            }
           
        }else{
            // TODO
        }
    }
}