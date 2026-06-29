/**
 * Formulaire de création / édition d'un modèle ML.
 * Permet de choisir l'algorithme, configurer les hyperparamètres et sauvegarder.
 */
import React from 'react'

function ModelForm({ initialData, onSubmit, onCancel }) {
  return (
    <form className="model-form">
      {/* Sélecteur d'algorithme (SVM, RandomForest, NN...) */}
      {/* Champs hyperparamètres dynamiques selon l'algo */}
      {/* Boutons Sauvegarder / Annuler */}
    </form>
  )
}

export default ModelForm
