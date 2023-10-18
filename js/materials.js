import { Vec3 } from "./primitives.js"
import { normalAtDispatch } from "./objects.js"

export function perfectDiffuse(ray, t, obj){
    let hit_point = ray.at(t)
    let new_dir = Vec3.random_spheric()
    let normal = normalAtDispatch(obj, hit_point)
    ray.origin = hit_point
    ray.direction = normal.dot(new_dir) >= 0 ? new_dir : new_dir.mul(-1)
}

export function lambertianDiffuse(ray, t, obj){
    let hit_point = ray.at(t)
    let new_dir = Vec3.random_spheric().normalized()
    let normal = normalAtDispatch(obj, hit_point)
    ray.origin = hit_point
    ray.direction = normal.add(new_dir)
}

export function mirror(ray, t, obj){
    let hit_point = ray.at(t)
    let new_dir = Vec3.random_spheric().normalized()
    let normal = normalAtDispatch(obj, hit_point)
    ray.origin = hit_point
    ray.direction = ray.direction.sub(normal.mul(2*ray.direction.dot(normal)))
}

export function granular_mirror(ray, t, obj){
    const granular_factor = 0.1
    let hit_point = ray.at(t)
    let new_dir = Vec3.random_spheric().normalized()
    let normal = normalAtDispatch(obj, hit_point)
    ray.origin = hit_point
    ray.direction = ray.direction.sub(normal.mul(2*ray.direction.dot(normal))).add(Vec3.random_spheric().normalized().mul(granular_factor))
}

export function refract(ray, t, obj){
    let hit_point = ray.at(t)
    let normal = normalAtDispatch(obj, hit_point)

    let eta   = 1
    let eta_p = 1.4

    if(eta/eta_p * Math.sqrt(1-ray.direction.dot(normal)*ray.direction.dot(normal)) > 1){
        mirror(ray, t, obj)
    }else{
        let perpendicular = ray.direction.add(normal.mul( ray.direction.mul(-1).dot(normal)) ).mul(eta/eta_p)
        let parallel = normal.mul(-Math.sqrt(1-perpendicular.norm_squared()))

        ray.origin = hit_point
        ray.direction = perpendicular.add(parallel)
    }
}