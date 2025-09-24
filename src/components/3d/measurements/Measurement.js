/**
 * Base Measurement Class
 * Based on https://github.com/AwesomeTeamOne/3DView.Measurements
 * Adapted for React Three Fiber and modern Three.js
 */

import * as THREE from 'three'

export class Measurement {
  constructor() {
    this.points = []
    this.previewPoint = null
    this.object3D = new THREE.Group()
    this.type = 'measurement'
    this.isFinished = false
    
    // Visual elements
    this.sphereGeometry = new THREE.SphereGeometry(0.02, 16, 16)
    this.sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    this.lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 })
    
    // Text elements for measurements
    this.textCanvas = document.createElement('canvas')
    this.textContext = this.textCanvas.getContext('2d')
    this.textCanvas.width = 256
    this.textCanvas.height = 64
  }

  addPoint(point) {
    this.points.push(point.clone())
    this.updateVisualization()
    return this.points.length
  }

  setPreviewPoint(point) {
    this.previewPoint = point.clone()
    this.updateVisualization()
  }

  updateVisualization() {
    // Clear existing visualization
    while (this.object3D.children.length > 0) {
      this.object3D.remove(this.object3D.children[0])
    }

    // Add point markers
    this.points.forEach(point => {
      const sphere = new THREE.Mesh(this.sphereGeometry, this.sphereMaterial)
      sphere.position.copy(point)
      this.object3D.add(sphere)
    })

    // Add preview point if exists
    if (this.previewPoint && !this.isComplete()) {
      const previewSphere = new THREE.Mesh(this.sphereGeometry, 
        new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.7 }))
      previewSphere.position.copy(this.previewPoint)
      this.object3D.add(previewSphere)
    }

    this.updateSpecificVisualization()
  }

  updateSpecificVisualization() {
    // Override in subclasses
  }

  createTextTexture(text, fontSize = 32) {
    this.textContext.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height)
    this.textContext.fillStyle = '#ffffff'
    this.textContext.font = `${fontSize}px Arial`
    this.textContext.textAlign = 'center'
    this.textContext.fillText(text, this.textCanvas.width / 2, this.textCanvas.height / 2)
    
    const texture = new THREE.CanvasTexture(this.textCanvas)
    texture.needsUpdate = true
    return texture
  }

  createTextSprite(text, position) {
    const texture = this.createTextTexture(text)
    const material = new THREE.SpriteMaterial({ map: texture })
    const sprite = new THREE.Sprite(material)
    sprite.position.copy(position)
    sprite.scale.set(0.3, 0.1, 1)
    return sprite
  }

  isComplete() {
    return this.isFinished
  }

  getValue() {
    return 0
  }

  getType() {
    return this.type
  }

  getInfo() {
    return {
      type: this.getType(),
      value: this.getValue(),
      points: this.points.length
    }
  }

  getObject3D() {
    return this.object3D
  }

  dispose() {
    while (this.object3D.children.length > 0) {
      this.object3D.remove(this.object3D.children[0])
    }
  }
}
