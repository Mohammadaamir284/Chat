import React from 'react'

const Input = ({
    label = '',
    placeholder = '',
    type = '',
    isRequired = true,
    value = '',
    className = '',
    onChange = () => { }

}) => {
    return (

        <div className={`flex flex-col  `}>
            <label className=" m-1  text-xl font-medium text-gray-900 ">{label}</label>
            <input type={type} className={`bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 ${className}`} placeholder={placeholder} required={isRequired} value={value} onChange={onChange} />
        </div>

    )
}

export default Input