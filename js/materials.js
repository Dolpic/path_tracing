import { Vec3, Ray } from "./primitives.js"

export function perfectDiffuse(ray, t, obj){
    Ray.moveAt(ray, t)
    let new_dir = Vec3.random_spheric()
    let normal = obj.normalAt(ray.origin)
    ray.direction = Vec3.dot(normal, new_dir) < 0 ? new_dir : Vec3.mul(new_dir, -1)
}

export function lambertianDiffuse(ray, t, obj){
    Ray.moveAt(ray, t)
    let normal = obj.normalAt(ray.origin)
    ray.direction = Vec3.add(normal, Vec3.normalize( Vec3.random_spheric(ray.direction) ))
}

export function mirror(ray, t, obj){
    Ray.moveAt(ray, t)
    let normal = obj.normalAt(ray.origin)
    Vec3.sub(ray.direction, Vec3.mul(normal, 2*Vec3.dot(ray.direction,normal) ) )
}

export function granular_mirror(ray, t, obj, granular_factor = 0.1){
    Ray.moveAt(ray, t)
    let normal = obj.normalAt(ray.origin)
    let reflectJiggle = Vec3.mul( Vec3.normalize(Vec3.random_spheric()), granular_factor) 
    let reflectDir = Vec3.mul(normal, 2*Vec3.dot(ray.direction, normal) )
    Vec3.sub(ray.direction, Vec3.add(reflectDir, reflectJiggle ))
}

export function refract(ray, t, obj, eta_from=1, eta_to=1){
    let normal = obj.normalAt(ray.origin) // Wrong !
    let dot = Vec3.dot(ray.direction, normal)
    let eta_ratio = eta_from/eta_to

    if(eta_ratio * Math.sqrt(1-dot*dot) > 1){
        mirror(ray, t, obj)
    }else{
        Ray.moveAt(ray, t)
        let toAdd = Vec3.dot(Vec3.mul( Vec3.clone(ray.direction), -1), normal)
        let perpendicular =  Vec3.add(ray.direction, toAdd)
        Vec3.mul(perpendicular, eta_ratio)
        let parallel = Vec3.mul(normal, -Math.sqrt(1-perpendicular.norm_squared()))
        ray.direction = Vec3.add(perpendicular, parallel)
    }
}